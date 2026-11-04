import { beforeEach, describe, expect, it, vi } from "vitest";

import { connectDB } from "@/shared/db";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import { countSegmentMembers } from "@/features/marketing/lib/segments/count-segment";
import {
  createSegment,
  listSegments,
} from "@/features/marketing/lib/segments/segment.repo";
import { segmentFilterSchema } from "@/features/marketing/schema/segment.schema";

const auth = vi.hoisted(() => ({ role: "admin" as "admin" | "driver" }));

vi.mock("@/features/auth/lib/require-role", () => ({
  requireAdmin: async () => {
    if (auth.role !== "admin") {
      return {
        ok: false as const,
        response: new Response(
          JSON.stringify({ success: false, error: "forbidden" }),
          { status: 403 },
        ),
      };
    }
    return {
      ok: true as const,
      session: {
        user: {
          id: "admin-1",
          role: auth.role,
          email: "admin@example.com",
          name: "Admin",
        },
      },
    };
  },
}));

beforeEach(() => {
  auth.role = "admin";
});

async function seedCustomer(input: {
  email: string;
  emailConsent: "none" | "granted" | "withdrawn";
  whatsappConsent: "none" | "granted" | "withdrawn";
  verifiedPhone?: string;
  rideCount?: number;
  lastRideAt?: Date | null;
}) {
  await connectDB();
  await CustomerStats.create({
    emailLower: input.email,
    name: input.email.split("@")[0],
    nameLower: input.email.split("@")[0],
    phoneDigits: (input.verifiedPhone ?? "").replace(/[^0-9]/g, ""),
    verifiedPhone: input.verifiedPhone ?? "",
    rideCount: input.rideCount ?? 1,
    lastRideAt: input.lastRideAt ?? new Date("2026-09-01T10:00:00Z"),
    emailConsent: input.emailConsent,
    whatsappConsent: input.whatsappConsent,
    locale: "en",
  });
}

describe("segment filter validation", () => {
  it("accepts only the C2 filter vocabulary", () => {
    expect(
      segmentFilterSchema.safeParse({ ridesMin: 2, locale: "fr" }).success,
    ).toBe(true);
    expect(segmentFilterSchema.safeParse({ ridesMin: -1 }).success).toBe(false);
    expect(segmentFilterSchema.safeParse({ locale: "zz" }).success).toBe(false);
  });

  it("rejects an invalid filter at the API and stores nothing", async () => {
    const { POST } = await import("@/app/api/admin/marketing/segments/route");
    const response = await POST(
      new Request("http://local/api/admin/marketing/segments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Bad",
          filter: { ridesMin: -5, locale: "zz" },
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await listSegments()).toHaveLength(0);
  });
});

describe("segment live count", () => {
  it("always applies channel consent and the verified WhatsApp requirement", async () => {
    await seedCustomer({
      email: "a@example.com",
      emailConsent: "granted",
      whatsappConsent: "granted",
      verifiedPhone: "+41 79 111 11 11",
    });
    await seedCustomer({
      email: "b@example.com",
      emailConsent: "none",
      whatsappConsent: "none",
      verifiedPhone: "+41 79 222 22 22",
    });
    await seedCustomer({
      email: "c@example.com",
      emailConsent: "granted",
      whatsappConsent: "granted",
      verifiedPhone: "",
    });

    const segment = await createSegment({
      name: "All customers",
      filter: segmentFilterSchema.parse({}),
    });

    const email = await countSegmentMembers(segment.filter, "email");
    expect(email).toMatchObject({ total: 3, eligible: 2, excluded: 1 });

    const whatsapp = await countSegmentMembers(segment.filter, "whatsapp");
    expect(whatsapp).toMatchObject({ total: 3, eligible: 1, excluded: 2 });
  });

  it("ignores consent fields stored in a saved filter", async () => {
    await seedCustomer({
      email: "granted@example.com",
      emailConsent: "granted",
      whatsappConsent: "granted",
      verifiedPhone: "+41 79 333 33 33",
    });
    const segment = await createSegment({
      name: "Stale consent filter",
      filter: segmentFilterSchema.parse({
        emailConsent: "none",
        whatsappConsent: "none",
        verifiedWhatsApp: "no",
      }),
    });

    expect((await countSegmentMembers(segment.filter, "email")).eligible).toBe(1);
    expect((await countSegmentMembers(segment.filter, "whatsapp")).eligible).toBe(
      1,
    );
  });

  it("counts updates live when consent changes", async () => {
    await seedCustomer({
      email: "d@example.com",
      emailConsent: "none",
      whatsappConsent: "none",
    });
    const segment = await createSegment({
      name: "Live",
      filter: segmentFilterSchema.parse({}),
    });

    expect((await countSegmentMembers(segment.filter, "email")).eligible).toBe(0);
    await CustomerStats.updateOne(
      { emailLower: "d@example.com" },
      { $set: { emailConsent: "granted" } },
    );
    expect((await countSegmentMembers(segment.filter, "email")).eligible).toBe(1);
  });

  it("serves the count over the admin API only", async () => {
    await seedCustomer({
      email: "e@example.com",
      emailConsent: "granted",
      whatsappConsent: "none",
    });
    const segment = await createSegment({
      name: "API",
      filter: segmentFilterSchema.parse({}),
    });
    const { GET } = await import(
      "@/app/api/admin/marketing/segments/[id]/count/route"
    );
    const context = { params: Promise.resolve({ id: segment.id }) };

    const ok = await GET(
      new Request(
        `http://local/api/admin/marketing/segments/${segment.id}/count?channel=email`,
      ),
      context,
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({
      success: true,
      count: { channel: "email", eligible: 1 },
    });

    const noChannel = await GET(
      new Request("http://local/api/admin/marketing/segments/x/count"),
      context,
    );
    expect(noChannel.status).toBe(400);

    auth.role = "driver";
    const forbidden = await GET(
      new Request(
        `http://local/api/admin/marketing/segments/${segment.id}/count?channel=email`,
      ),
      context,
    );
    expect(forbidden.status).toBe(403);
  });
});

describe("segment creation", () => {
  it("stores the validated filter and creator", async () => {
    const { POST } = await import("@/app/api/admin/marketing/segments/route");
    const response = await POST(
      new Request("http://local/api/admin/marketing/segments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Regulars",
          filter: { ridesMin: 5, lastRide: "within", lastRideDays: 90 },
        }),
      }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.segment).toMatchObject({
      name: "Regulars",
      createdBy: "admin@example.com",
      filter: { ridesMin: 5, lastRideDays: 90 },
    });
  });

  it("returns 403 for non-admin roles", async () => {
    auth.role = "driver";
    const { POST } = await import("@/app/api/admin/marketing/segments/route");
    const response = await POST(
      new Request("http://local/api/admin/marketing/segments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Nope", filter: {} }),
      }),
    );
    expect(response.status).toBe(403);
  });
});
