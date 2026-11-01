import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetTestDb } from "./helpers/db";
import Setting from "@/features/settings/model/Setting";
import Campaign from "@/features/marketing/model/Campaign";
import ClickEvent from "@/features/marketing/model/ClickEvent";
import { createSegment } from "@/features/marketing/lib/segments/segment.repo";
import { createCampaignTemplate } from "@/features/marketing/lib/templates/campaign-template.repo";
import { createCampaign } from "@/features/marketing/lib/campaigns/campaign.repo";
import {
  attributeBookingToCampaign,
} from "@/features/marketing/lib/attribution/attribute-booking";
import { isTrackingEnabled } from "@/features/marketing/lib/tracking/record-tracking-event";

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
        user: { id: "admin-1", role: auth.role, email: "admin@example.com" },
      },
    };
  },
}));

beforeEach(async () => {
  await resetTestDb();
  process.env.NEXTAUTH_SECRET = "test-secret";
  await Setting.create({ publicBaseUrl: "https://rides.example.com" });
  auth.role = "admin";
});

afterEach(() => {
  auth.role = "admin";
});

describe("campaigns API (C10)", () => {
  it("creates and lists campaigns for admins only", async () => {
    const { POST, GET } = await import("@/app/api/admin/marketing/campaigns/route");
    const create = await POST(
      new Request("http://local/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Spring rides",
          channel: "email",
          segmentId: "000000000000000000000000",
          templateId: "000000000000000000000000",
        }),
      }),
    );
    expect(create.status).toBe(201);

    const list = await GET(
      new Request("http://local/api/admin/marketing/campaigns"),
    );
    expect(list.status).toBe(200);
    const body = await list.json();
    expect(body.campaigns).toHaveLength(1);

    auth.role = "driver";
    const forbidden = await GET(
      new Request("http://local/api/admin/marketing/campaigns"),
    );
    expect(forbidden.status).toBe(403);
  });

  it("pauses, resumes and cancels", async () => {
    const campaign = await createCampaign({
      name: "P",
      channel: "email",
      createdBy: "admin-1",
    } as never);
    await Campaign.updateOne(
      { _id: campaign.id },
      { $set: { status: "scheduled" } },
    );

    const pauseMod = await import(
      "@/app/api/admin/marketing/campaigns/[id]/pause/route"
    );
    const resumeMod = await import(
      "@/app/api/admin/marketing/campaigns/[id]/resume/route"
    );
    const cancelMod = await import(
      "@/app/api/admin/marketing/campaigns/[id]/cancel/route"
    );

    const ctx = { params: Promise.resolve({ id: campaign.id }) };
    const paused = await pauseMod.POST(
      new Request("http://local/x", { method: "POST" }),
      ctx,
    );
    expect(paused.status).toBe(200);
    expect((await paused.json()).campaign.status).toBe("paused");

    const resumed = await resumeMod.POST(
      new Request("http://local/x", { method: "POST" }),
      ctx,
    );
    expect(resumed.status).toBe(200);
    expect((await resumed.json()).campaign.status).toBe("scheduled");

    const cancelled = await cancelMod.POST(
      new Request("http://local/x", { method: "POST" }),
      ctx,
    );
    expect(cancelled.status).toBe(200);
    expect((await cancelled.json()).campaign.status).toBe("cancelled");
  });
});

describe("tracking disabled by default (C10)", () => {
  it("does not record click events when settings are off", async () => {
    const { GET } = await import("@/app/api/marketing/track/click/route");
    const response = await GET(
      new Request("http://local/api/marketing/track/click?c=abc&r=def&u=https://example.com"),
    );
    expect(response.status).toBe(302);
    const events = await ClickEvent.find({}).lean();
    expect(events).toHaveLength(0);
    expect(await isTrackingEnabled("click")).toBe(false);
  });

  it("does not record open events when settings are off", async () => {
    const { GET } = await import("@/app/api/marketing/track/open/route");
    const response = await GET(
      new Request("http://local/api/marketing/track/open?c=abc&r=def"),
    );
    expect(response.status).toBe(200);
    const events = await ClickEvent.find({}).lean();
    expect(events).toHaveLength(0);
    expect(await isTrackingEnabled("open")).toBe(false);
  });
});

describe("booking attribution (C10)", () => {
  it("attributes a booking within 7 days via utm_campaign", async () => {
    const segment = await createSegment({ name: "All", filter: {} as never });
    const template = await createCampaignTemplate({
      channel: "email",
      name: "Welcome",
      locales: {
        en: {
          subject: "Hi",
          preheader: "",
          body: "<p>Hi</p>{{unsubscribeUrl}}",
        },
      },
    } as never);
    const campaign = await createCampaign({
      name: "spring",
      channel: "email",
      segmentId: segment.id,
      templateId: template.id,
      createdBy: "admin-1",
    } as never);
    await Campaign.updateOne(
      { _id: campaign.id },
      { $set: { scheduledAt: new Date("2026-01-01T00:00:00Z"), status: "done" } },
    );

    const result = await attributeBookingToCampaign({
      utmCampaign: "spring",
      createdAt: new Date("2026-01-03T00:00:00Z"),
    });
    expect(result.attributed).toBe(true);

    const updated = await Campaign.findById(campaign.id).lean<{ stats?: Record<string, number> }>();
    expect((updated?.stats?.attributed ?? 0) + (updated?.stats?.attributedCount ?? 0)).toBeGreaterThan(0);
  });

  it("does not attribute outside the 7-day window", async () => {
    const campaign = await createCampaign({
      name: "late",
      channel: "email",
      createdBy: "admin-1",
    } as never);
    await Campaign.updateOne(
      { _id: campaign.id },
      { $set: { scheduledAt: new Date("2026-01-01T00:00:00Z"), status: "done" } },
    );

    const result = await attributeBookingToCampaign({
      campaignId: campaign.id,
      createdAt: new Date("2026-01-20T00:00:00Z"),
    });
    expect(result.attributed).toBe(false);
  });
});