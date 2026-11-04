import { afterEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import CustomerSession from "@/features/customers/model/CustomerSession";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import RideCharge from "@/features/invoices/model/RideCharge";
import WhatsAppSendLog from "@/features/settings/model/WhatsAppSendLog";
import type { CustomerProfilePayload } from "@/features/customers-admin/lib/customer-profile/customer-profile.types";

const auth = vi.hoisted(() => ({ role: "admin" as "admin" | "driver" }));

vi.mock("@/features/auth/lib/require-role", () => ({
  requireAdmin: async () =>
    auth.role === "admin"
      ? { ok: true, session: { user: { id: "admin-1", role: "admin" } } }
      : {
          ok: false,
          response: new Response(
            JSON.stringify({ success: false, error: "forbidden" }),
            { status: 403 },
          ),
        },
}));

const EMAIL = "ada@example.com";
const OTHER_EMAIL = "bob@example.com";
const PHONE = "41791234567";
const NOW = new Date("2025-06-01T12:00:00.000Z");
const FUTURE = new Date("2026-01-01T12:00:00.000Z");

afterEach(() => {
  auth.role = "admin";
});

function get(url: string) {
  return new Request(url, { method: "GET" });
}

function del(url: string) {
  return new Request(url, { method: "DELETE" });
}

function params<T extends Record<string, string>>(values: T) {
  return { params: Promise.resolve(values) };
}

async function bodyOf(response: Response) {
  return (await response.json()) as {
    success: boolean;
    error?: string;
    revoked?: number;
    data?: CustomerProfilePayload;
  };
}

async function seedCustomer() {
  await connectDB();
  const selectedVehicle = new mongoose.Types.ObjectId();

  const [first, second] = await Booking.insertMany([
    {
      tripId: "TRIP-A",
      pickup: "Airport",
      dropoff: "Hotel",
      tripType: "oneway",
      date: "2025-01-10",
      time: "09:30",
      passengers: 2,
      selectedVehicle,
      firstName: "Ada",
      lastName: "Lovelace",
      email: EMAIL,
      phone: "+41 79 123 45 67",
      whatsappOptIn: true,
      status: "completed",
      paymentStatus: "completed",
      paymentMethod: "stripe",
      totalAmount: 100,
      amountPaidCents: 10_000,
      amountRefundedCents: 2_500,
      createdAt: new Date("2025-01-01T08:00:00.000Z"),
    },
    {
      tripId: "TRIP-B",
      pickup: "Office",
      dropoff: "Station",
      tripType: "oneway",
      date: "2025-03-01",
      time: "12:00",
      passengers: 1,
      selectedVehicle,
      firstName: "Ada",
      lastName: "Lovelace",
      email: EMAIL.toUpperCase(),
      phone: "+41 79 123 45 67",
      status: "upcoming",
      paymentStatus: "pending",
      paymentMethod: "cash",
      totalAmount: 50,
      createdAt: new Date("2025-03-01T09:00:00.000Z"),
    },
  ]);

  await CustomerStats.create({
    emailLower: EMAIL,
    name: "Ada Lovelace",
    nameLower: "ada lovelace",
    phoneDigits: PHONE,
    verifiedPhone: PHONE,
    rideCount: 2,
    completedCount: 1,
    totalSpendMinor: 15_000,
    currency: "CHF",
    firstRideAt: new Date("2025-01-10T09:30:00.000Z"),
    lastRideAt: new Date("2025-01-10T09:30:00.000Z"),
    hasUpcoming: true,
    locale: "fr",
    emailConsent: "granted",
    whatsappConsent: "granted",
    rebuiltAt: NOW,
  });

  await CustomerProfile.create({
    email: EMAIL,
    name: "Ada Lovelace",
    verifiedPhone: PHONE,
    verifiedPhoneAt: new Date("2025-02-01T10:00:00.000Z"),
    language: "fr",
  });

  await RideCharge.create({
    orderId: "due_profile_1",
    tripId: "TRIP-A",
    amount: 40,
    purpose: "balance",
    provider: "stripe",
    status: "paid",
    createdAt: new Date("2025-01-02T10:00:00.000Z"),
  });

  const sessions = await CustomerSession.insertMany([
    {
      idHash: "hash-mobile",
      emailLower: EMAIL,
      createdAt: new Date("2025-05-01T10:00:00.000Z"),
      lastSeenAt: new Date("2025-05-30T10:00:00.000Z"),
      expiresAt: FUTURE,
      uaFamily: "mobile",
      ipPrefix: "41.23",
      revokedAt: null,
    },
    {
      idHash: "hash-desktop",
      emailLower: EMAIL,
      createdAt: new Date("2025-05-02T10:00:00.000Z"),
      lastSeenAt: new Date("2025-05-31T10:00:00.000Z"),
      expiresAt: FUTURE,
      uaFamily: "desktop",
      ipPrefix: "41.24",
      revokedAt: null,
    },
    {
      idHash: "hash-other",
      emailLower: OTHER_EMAIL,
      createdAt: new Date("2025-05-03T10:00:00.000Z"),
      lastSeenAt: new Date("2025-05-31T11:00:00.000Z"),
      expiresAt: FUTURE,
      uaFamily: "mobile",
      ipPrefix: "41.25",
      revokedAt: null,
    },
  ]);

  await WhatsAppSendLog.insertMany([
    {
      idempotencyKey: "otp-older",
      jid: `${PHONE}@s.whatsapp.net`,
      kind: "otp",
      status: "failed",
      attempts: 1,
      createdAt: new Date("2025-05-20T08:00:00.000Z"),
    },
    {
      idempotencyKey: "otp-latest",
      jid: `${PHONE}@s.whatsapp.net`,
      kind: "otp",
      status: "sent",
      attempts: 1,
      createdAt: new Date("2025-05-21T08:00:00.000Z"),
    },
  ]);

  return { first, second, sessions };
}

describe("GET /api/admin/customers/[id]", () => {
  it("returns profile data that matches the customer's bookings", async () => {
    const { first, second } = await seedCustomer();
    const { GET } = await import("@/app/api/admin/customers/[id]/route");

    const response = await GET(get(`http://x/api/admin/customers/${EMAIL}`), params({ id: EMAIL }));
    expect(response.status).toBe(200);
    const body = await bodyOf(response);
    const data = body.data;
    if (!data) throw new Error("expected profile data");

    const stored = await Booking.find({ email: EMAIL })
      .collation({ locale: "en", strength: 2 })
      .lean();
    expect(data.bookings.map((row) => row.tripId).sort()).toEqual(
      stored.map((row) => row.tripId).sort(),
    );
    expect(data.bookings).toHaveLength(2);

    const completed = data.bookings.find((row) => row.tripId === "TRIP-A");
    expect(completed).toMatchObject({
      id: String(first._id),
      status: "completed",
      paymentStatus: "completed",
      paymentMethod: "stripe",
      totalMinor: 10_000,
      paidMinor: 10_000,
      refundedMinor: 2_500,
    });
    const upcoming = data.bookings.find((row) => row.tripId === "TRIP-B");
    expect(upcoming).toMatchObject({
      id: String(second._id),
      status: "upcoming",
      totalMinor: 5_000,
      paidMinor: 0,
    });

    expect(data.header).toMatchObject({
      email: EMAIL,
      name: "Ada Lovelace",
      verifiedPhone: PHONE,
      locale: "fr",
      rides: 2,
      completedRides: 1,
      spendMinor: 15_000,
      currency: "CHF",
      emailConsent: "granted",
      whatsappConsent: "granted",
    });

    expect(data.payments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "payment",
          tripId: "TRIP-A",
          amountMinor: 10_000,
        }),
        expect.objectContaining({
          kind: "refund",
          tripId: "TRIP-A",
          amountMinor: 2_500,
        }),
        expect.objectContaining({
          kind: "ride_charge",
          tripId: "TRIP-A",
          amountMinor: 4_000,
          method: "stripe",
          status: "paid",
        }),
      ]),
    );
  });

  it("reports verified WhatsApp details and the latest delivery", async () => {
    await seedCustomer();
    const { GET } = await import("@/app/api/admin/customers/[id]/route");

    const response = await GET(get(`http://x/api/admin/customers/${EMAIL}`), params({ id: EMAIL }));
    const data = (await bodyOf(response)).data;
    if (!data) throw new Error("expected profile data");

    expect(data.whatsapp).toMatchObject({
      verifiedPhone: PHONE,
      verifiedAt: "2025-02-01T10:00:00.000Z",
      consent: "granted",
      lastSend: { status: "sent", kind: "otp" },
    });
    expect(data.whatsapp.lastSend?.at).toBe("2025-05-21T08:00:00.000Z");
  });

  it("does not infer consent from a legacy booking opt-in", async () => {
    await connectDB();
    const selectedVehicle = new mongoose.Types.ObjectId();
    await Booking.create({
      tripId: "TRIP-LEGACY",
      pickup: "A",
      dropoff: "B",
      tripType: "oneway",
      date: "2025-01-01",
      time: "10:00",
      passengers: 1,
      selectedVehicle,
      firstName: "Legacy",
      lastName: "Rider",
      email: "legacy@example.com",
      phone: "41791112233",
      whatsappOptIn: true,
    });
    const { GET } = await import("@/app/api/admin/customers/[id]/route");

    const response = await GET(
      get("http://x/api/admin/customers/legacy@example.com"),
      params({ id: "legacy@example.com" }),
    );
    expect(response.status).toBe(200);
    const data = (await bodyOf(response)).data;
    if (!data) throw new Error("expected profile data");
    expect(data.header.emailConsent).toBe("none");
    expect(data.header.whatsappConsent).toBe("none");
    expect(data.whatsapp.consent).toBe("none");
  });
});

describe("DELETE /api/admin/customers/[id]/sessions", () => {
  it("revokes every active session for that customer only", async () => {
    await seedCustomer();
    const { DELETE } = await import("@/app/api/admin/customers/[id]/sessions/route");

    const response = await DELETE(
      del(`http://x/api/admin/customers/${EMAIL}/sessions`),
      params({ id: EMAIL }),
    );
    expect(response.status).toBe(200);
    expect(await bodyOf(response)).toMatchObject({ success: true, revoked: 2 });

    const own = await CustomerSession.find({ emailLower: EMAIL });
    expect(own).toHaveLength(2);
    expect(own.every((session) => session.revokedAt instanceof Date)).toBe(true);

    const other = await CustomerSession.findOne({ emailLower: OTHER_EMAIL });
    expect(other?.revokedAt).toBeNull();

    const again = await DELETE(
      del(`http://x/api/admin/customers/${EMAIL}/sessions`),
      params({ id: EMAIL }),
    );
    expect(await bodyOf(again)).toMatchObject({ success: true, revoked: 0 });
  });
});

describe("DELETE /api/admin/customers/[id]/sessions/[sessionId]", () => {
  it("revokes one session and refuses sessions of another customer", async () => {
    const { sessions } = await seedCustomer();
    const { DELETE } = await import(
      "@/app/api/admin/customers/[id]/sessions/[sessionId]/route"
    );
    const [own, desktop, foreign] = sessions;

    const cross = await DELETE(
      del(`http://x/api/admin/customers/${EMAIL}/sessions/${foreign._id}`),
      params({ id: EMAIL, sessionId: String(foreign._id) }),
    );
    expect(cross.status).toBe(404);
    const untouched = await CustomerSession.findById(foreign._id);
    expect(untouched?.revokedAt).toBeNull();

    const ok = await DELETE(
      del(`http://x/api/admin/customers/${EMAIL}/sessions/${own._id}`),
      params({ id: EMAIL, sessionId: String(own._id) }),
    );
    expect(ok.status).toBe(200);
    expect(await bodyOf(ok)).toMatchObject({ success: true, revoked: 1 });

    const revoked = await CustomerSession.findById(own._id);
    expect(revoked?.revokedAt).toBeInstanceOf(Date);
    const otherOwn = await CustomerSession.findById(desktop._id);
    expect(otherOwn?.revokedAt).toBeNull();

    const malformed = await DELETE(
      del(`http://x/api/admin/customers/${EMAIL}/sessions/nope`),
      params({ id: EMAIL, sessionId: "nope" }),
    );
    expect(malformed.status).toBe(400);
  });
});

describe("admin-only access", () => {
  it("returns 403 for non-admin roles on every profile route", async () => {
    await seedCustomer();
    const { GET } = await import("@/app/api/admin/customers/[id]/route");
    const { DELETE: revokeAll } = await import(
      "@/app/api/admin/customers/[id]/sessions/route"
    );
    const { DELETE: revokeOne } = await import(
      "@/app/api/admin/customers/[id]/sessions/[sessionId]/route"
    );
    const sessionId = String(new mongoose.Types.ObjectId());

    auth.role = "driver";

    const read = await GET(get(`http://x/api/admin/customers/${EMAIL}`), params({ id: EMAIL }));
    expect(read.status).toBe(403);

    const all = await revokeAll(
      del(`http://x/api/admin/customers/${EMAIL}/sessions`),
      params({ id: EMAIL }),
    );
    expect(all.status).toBe(403);

    const one = await revokeOne(
      del(`http://x/api/admin/customers/${EMAIL}/sessions/${sessionId}`),
      params({ id: EMAIL, sessionId }),
    );
    expect(one.status).toBe(403);
  });
});

describe("unknown customers", () => {
  it("returns 404 on profile and revoke routes", async () => {
    const { GET } = await import("@/app/api/admin/customers/[id]/route");
    const { DELETE: revokeAll } = await import(
      "@/app/api/admin/customers/[id]/sessions/route"
    );
    const { DELETE: revokeOne } = await import(
      "@/app/api/admin/customers/[id]/sessions/[sessionId]/route"
    );
    const unknown = "nobody@example.com";
    const sessionId = String(new mongoose.Types.ObjectId());

    const read = await GET(get(`http://x/api/admin/customers/${unknown}`), params({ id: unknown }));
    expect(read.status).toBe(404);

    const all = await revokeAll(
      del(`http://x/api/admin/customers/${unknown}/sessions`),
      params({ id: unknown }),
    );
    expect(all.status).toBe(404);

    const one = await revokeOne(
      del(`http://x/api/admin/customers/${unknown}/sessions/${sessionId}`),
      params({ id: unknown, sessionId }),
    );
    expect(one.status).toBe(404);
  });
});
