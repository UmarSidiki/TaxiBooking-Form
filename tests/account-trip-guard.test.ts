import { afterAll, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { signCustomerToken } from "@/features/customers/lib/customer-token";
import { Booking } from "@/features/booking/model";
import { createRide, createVehicle } from "./helpers/fixtures";

vi.mock("next/headers", () => ({ cookies: async () => new Map() }));

afterAll(() => {
  vi.doUnmock("next/headers");
  vi.resetModules();
});

function dayOffset(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function act(id: string, email: string, body: unknown) {
  process.env.NEXTAUTH_SECRET = "test-secret";
  const { POST } = await import("@/app/api/account/trips/[id]/route");
  const token = signCustomerToken(email);
  const request = new Request(`http://x/api/account/trips/${id}?token=${token}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return POST(request, { params: Promise.resolve({ id }) });
}

const vehicle = () => new mongoose.Types.ObjectId();

describe("customer account trip guard", () => {
  it("returns 404 (not a CastError 500) for a non-ObjectId id", async () => {
    const response = await act("not-an-object-id", "ada@example.com", { action: "cancel" });
    expect(response.status).toBe(404);
  });

  it("only lets the owning customer act on a trip", async () => {
    await createRide({ selectedVehicle: vehicle(), tripId: "trip-own", status: "upcoming", date: dayOffset(30), time: "12:00" });
    const other = await act("trip-own", "bob@example.com", { action: "cancel" });
    expect(other.status).toBe(404);
    const owner = await act("trip-own", "ada@example.com", { action: "cancel" });
    expect(owner.status).toBe(200);
  });

  it("allows a change on a future upcoming ride", async () => {
    const vehicle = await createVehicle();
    await createRide({ selectedVehicle: vehicle._id, bookingType: "hourly", duration: 2, tripId: "trip-move", status: "upcoming", date: dayOffset(30), time: "12:00" });
    const response = await act("trip-move", "ada@example.com", { action: "change", date: dayOffset(40), time: "09:00" });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.time).toBe("09:00");
    expect(typeof body.totalAmount).toBe("number");
  });

  it("is idempotent when the trip is already cancelled", async () => {
    await createRide({ selectedVehicle: vehicle(), tripId: "trip-twice", status: "upcoming", date: dayOffset(30), time: "12:00" });
    const first = await act("trip-twice", "ada@example.com", { action: "cancel" });
    expect(first.status).toBe(200);
    const afterFirst = await Booking.findOne({ tripId: "trip-twice" });
    const second = await act("trip-twice", "ada@example.com", { action: "cancel" });
    expect(second.status).toBe(200);
    expect((await second.json()).status).toBe("canceled");
    const afterSecond = await Booking.findOne({ tripId: "trip-twice" });
    expect(afterSecond?.canceledAt?.getTime()).toBe(afterFirst?.canceledAt?.getTime());
  });

  it("rejects acting on a completed trip with a clear code", async () => {
    await createRide({ selectedVehicle: vehicle(), tripId: "trip-done", status: "completed", date: dayOffset(30), time: "12:00" });
    const response = await act("trip-done", "ada@example.com", { action: "cancel" });
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("not_modifiable");
    expect(body.reason).toBe("status");
  });

  it("rejects a change once the pickup time has passed", async () => {
    await createRide({ selectedVehicle: vehicle(), tripId: "trip-past", status: "upcoming", date: dayOffset(-1), time: "12:00" });
    const response = await act("trip-past", "ada@example.com", { action: "change", date: dayOffset(40), time: "09:00" });
    expect(response.status).toBe(409);
    expect((await response.json()).reason).toBe("cutoff");
  });
});
