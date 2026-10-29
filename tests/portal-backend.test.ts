import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { signCustomerToken } from "@/features/customers/lib/customer-token";
import { Booking, RefundRequest } from "@/features/booking/model";
import { createRide, createVehicle } from "./helpers/fixtures";
import { applyCustomerTripAction } from "@/features/customers/lib/apply-customer-trip-action";
import { Setting } from "@/features/settings/model";
import PricingRule from "@/features/pricing/model/PricingRule";
import { notify } from "@/features/notifications/notify";
import { computeCancelFee } from "@/features/customers/lib/cancel-policy";

const mocks = vi.hoisted(() => ({
  stripe: { refunds: { create: vi.fn() } },
}));

vi.mock("next/headers", () => ({ cookies: async () => new Map() }));
vi.mock("@/features/payments/lib/stripe-client", () => ({
  getStripeClient: vi.fn(async () => mocks.stripe),
  getStripeApiVersion: () => "2026-07-29.dahlia",
}));
vi.mock("@/features/notifications/notify", () => ({
  notify: vi.fn(async () => ({ ok: true, queued: 0, skipped: null, deliveries: [] })),
}));
vi.mock("@/features/auth/lib/require-role", () => ({
  requireAdmin: async () => ({ ok: true }),
  requireRole: async () => ({ ok: true }),
}));

afterAll(() => {
  vi.doUnmock("next/headers");
  vi.resetModules();
});

function dayOffset(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

beforeEach(async () => {
  vi.clearAllMocks();
  mocks.stripe.refunds.create.mockResolvedValue({ id: "re_1" });
});

describe("portal backend", () => {
  it("applies fee tiers based on hours before the ride", () => {
    const policy = [
      { hoursBefore: 24, feePercent: 50 },
      { hoursBefore: 2, feePercent: 100 },
    ];
    expect(computeCancelFee(policy, 100, 48).feePercent).toBe(0);
    expect(computeCancelFee(policy, 100, 12).feePercent).toBe(50);
    expect(computeCancelFee(policy, 100, 1).feePercent).toBe(100);
    expect(computeCancelFee(policy, 100, 12).refundAmount).toBe(50);
  });

  it("creates exactly one RefundRequest on double cancel", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    const vehicle = await createVehicle();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-double-cancel",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
    });
    const first = await applyCustomerTripAction({
      id: "trip-double-cancel",
      email: "ada@example.com",
      action: "cancel",
    });
    expect(first.ok).toBe(true);
    const second = await applyCustomerTripAction({
      id: "trip-double-cancel",
      email: "ada@example.com",
      action: "cancel",
    });
    expect(second.ok).toBe(true);
    const count = await RefundRequest.countDocuments({ bookingId: ride._id, reason: "cancellation" });
    expect(count).toBe(1);
  });

  it("notifies booking_cancelled on cancel", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-notify-cancel",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
    });
    await applyCustomerTripAction({
      id: "trip-notify-cancel",
      email: "ada@example.com",
      action: "cancel",
    });
    expect(notify).toHaveBeenCalledWith("booking_cancelled", expect.anything());
  });

  it("price increase returns a pay link", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-price-up",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
    });
    const result = await applyCustomerTripAction({
      id: "trip-price-up",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: true,
      baseUrl: "http://localhost:3000",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(typeof result.payUrl).toBe("string");
  });

  it("price decrease creates a refund request", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-price-down",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: true,
      totalAmount: 70,
    });
    const result = await applyCustomerTripAction({
      id: "trip-price-down",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.refundRequestId).toBeTruthy();
    const count = await RefundRequest.countDocuments({ bookingId: ride._id, reason: "booking_change" });
    expect(count).toBe(1);
  });

  it("notifies booking_changed on change", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-notify-change",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
    });
    await applyCustomerTripAction({
      id: "trip-notify-change",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(40),
      time: "09:00",
    });
    expect(notify).toHaveBeenCalledWith("booking_changed", expect.anything());
  });

  it("approve calls stripe.refunds.create once with amount in cents and idempotencyKey", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-approve",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      stripePaymentIntentId: "pi_test",
    });
    await applyCustomerTripAction({
      id: "trip-approve",
      email: "ada@example.com",
      action: "cancel",
    });
    const rr = await RefundRequest.findOne({ tripId: "trip-approve" });
    expect(rr).toBeTruthy();
    const { POST } = await import("@/app/api/admin/refund-requests/[id]/approve/route");
    const res = await POST(new NextRequest("http://x"), { params: Promise.resolve({ id: String(rr!._id) }) });
    expect(res.status).toBe(200);
    expect(mocks.stripe.refunds.create).toHaveBeenCalledTimes(1);
    expect(mocks.stripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: Math.round(rr!.amount * 100) }),
      expect.objectContaining({ idempotencyKey: `refund_${String(rr!._id)}` }),
    );
  });

  it("approve twice results in one refund", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-approve-twice",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      stripePaymentIntentId: "pi_test",
    });
    await applyCustomerTripAction({
      id: "trip-approve-twice",
      email: "ada@example.com",
      action: "cancel",
    });
    const rr = await RefundRequest.findOne({ tripId: "trip-approve-twice" });
    const { POST } = await import("@/app/api/admin/refund-requests/[id]/approve/route");
    const first = await POST(new NextRequest("http://x"), { params: Promise.resolve({ id: String(rr!._id) }) });
    const second = await POST(new NextRequest("http://x"), { params: Promise.resolve({ id: String(rr!._id) }) });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mocks.stripe.refunds.create).toHaveBeenCalledTimes(1);
  });
});
