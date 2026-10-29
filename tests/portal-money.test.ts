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
import { finalizeQuoteBooking } from "@/features/payments/lib/finalize-quote-booking";
import { finalizePaidBooking } from "@/features/payments/lib/finalize-paid-booking";

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

describe("portal money", () => {
  it("C1 decrease card -> refund request exact diff", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c1",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: true,
      totalAmount: 70,
      amountPaidCents: 7000,
    });
    const result = await applyCustomerTripAction({
      id: "trip-c1",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toBe("refund");
    expect(result.amount).toBe(10);
    expect(result.refundRequestId).toBeTruthy();
    const rr = await RefundRequest.findOne({ bookingId: ride._id, reason: "booking_change" });
    expect(rr).toBeTruthy();
    expect(rr!.amount).toBe(10);
    expect(rr!.amountCents).toBe(1000);
  });

  it("C2 decrease cash unpaid -> no refund, balance", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c2",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: true,
      totalAmount: 70,
      paymentMethod: "cash",
      paymentStatus: "pending",
      amountPaidCents: 0,
    });
    const result = await applyCustomerTripAction({
      id: "trip-c2",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.refundRequestId).toBeFalsy();
    expect(result.action).toBe("balance_due");
    const count = await RefundRequest.countDocuments({ tripId: "trip-c2" });
    expect(count).toBe(0);
    const booking = await Booking.findOne({ tripId: "trip-c2" });
    expect(booking?.totalAmount).toBe(60);
  });

  it("C3 increase -> pay link exact diff, booking unchanged until paid", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c3",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
      amountPaidCents: 6000,
    });
    const result = await applyCustomerTripAction({
      id: "trip-c3",
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
    expect(result.action).toBe("pay");
    expect(result.amount).toBe(10);
    const booking = await Booking.findOne({ tripId: "trip-c3" });
    expect(booking?.totalAmount).toBe(60);
    expect(booking?.pendingChange?.diffCents).toBe(1000);
    expect(booking?.pendingChange?.newTotalCents).toBe(7000);
    expect(booking?.status).toBe("awaiting_payment");
  });

  it("C4 pay link paid via webhook applies pending change", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c4",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
      amountPaidCents: 6000,
    });
    await applyCustomerTripAction({
      id: "trip-c4",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: true,
      baseUrl: "http://localhost:3000",
    });
    const before = await Booking.findOne({ tripId: "trip-c4" });
    const res = await finalizeQuoteBooking({
      booking: before as any,
      provider: "stripe",
      paidAmount: 10,
      currency: "EUR",
      baseUrl: "http://localhost:3000",
    });
    expect(res.success).toBe(true);
    const after = await Booking.findOne({ tripId: "trip-c4" });
    expect(after?.status).toBe("upcoming");
    expect(after?.paymentStatus).toBe("completed");
    expect(after?.totalAmount).toBe(70);
    expect(after?.amountPaidCents).toBe(7000);
    expect(after?.pendingChange).toBeUndefined();
  });

  it("C5 expired/unpaid pending change keeps original", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c5",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
      amountPaidCents: 6000,
    });
    await applyCustomerTripAction({
      id: "trip-c5",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: true,
      baseUrl: "http://localhost:3000",
    });
    // expire the pending change
    await Booking.updateOne(
      { tripId: "trip-c5" },
      { $set: { "pendingChange.expiresAt": new Date(Date.now() - 1000) } },
    );
    const booking = await Booking.findOne({ tripId: "trip-c5" });
    const res = await finalizeQuoteBooking({
      booking: booking as any,
      provider: "stripe",
      paidAmount: 10,
      currency: "EUR",
      baseUrl: "http://localhost:3000",
    });
    expect(res.success).toBe(false);
    const after = await Booking.findOne({ tripId: "trip-c5" });
    expect(after?.totalAmount).toBe(60);
    expect(after?.pendingChange).toBeUndefined();
  });

  it("C6 up then down nets vs paid", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c6",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
      amountPaidCents: 6000,
    });
    // up (pending, not applied)
    await applyCustomerTripAction({
      id: "trip-c6",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: true,
      baseUrl: "http://localhost:3000",
    });
    // down from original
    const result = await applyCustomerTripAction({
      id: "trip-c6",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // netPaid still 60; newTotal 60 -> none
    expect(result.action).toBe("none");
    const booking = await Booking.findOne({ tripId: "trip-c6" });
    expect(booking?.totalAmount).toBe(60);
    expect(booking?.pendingChange).toBeUndefined();
  });

  it("C7 down then up nets vs paid", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c7",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: true,
      totalAmount: 70,
      amountPaidCents: 7000,
    });
    // down (applied, refund request pending)
    await applyCustomerTripAction({
      id: "trip-c7",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: false,
    });
    // up back to 70
    const result = await applyCustomerTripAction({
      id: "trip-c7",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: true,
      baseUrl: "http://localhost:3000",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // netPaid = 70 - 10 (pending refund) = 60; newTotal 70 -> pay 10
    expect(result.action).toBe("pay");
    expect(result.amount).toBe(10);
  });

  it("C8 change after partial refund", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c8",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: true,
      totalAmount: 70,
      amountPaidCents: 7000,
      refundAmount: 10,
      amountRefundedCents: 1000,
    });
    const result = await applyCustomerTripAction({
      id: "trip-c8",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: false,
      baseUrl: "http://localhost:3000",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // netPaid = 70-10=60; newTotal 60 -> none
    expect(result.action).toBe("none");
  });

  it("C9 promo booking change no double discount, invalid promo dropped", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    const PromoCode = (await import("@/features/pricing/model/PromoCode")).default;
    await PromoCode.create({ code: "SAVE10", kind: "percent", amount: 10, active: true });
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c9",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
      amountPaidCents: 5400,
      promoCode: "SAVE10",
    });
    // invalidate promo
    await PromoCode.updateOne({ code: "SAVE10" }, { $set: { active: false } });
    const result = await applyCustomerTripAction({
      id: "trip-c9",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(31),
      time: "12:00",
      meetAndGreet: false,
      baseUrl: "http://localhost:3000",
      dryRun: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // promo dropped -> price should be higher than discounted; newTotal > 54
    expect(result.newTotal).toBeGreaterThan(54);
    const booking = await Booking.findOne({ tripId: "trip-c9" });
    // dryRun doesn't mutate
    expect(booking?.promoCode).toBe("SAVE10");
  });

  it("C10 holiday surcharge for new date", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: false, price: 0 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
      holidays: [{ start: dayOffset(31), end: dayOffset(31), percent: 20 }],
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c10",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
      amountPaidCents: 6000,
    });
    const result = await applyCustomerTripAction({
      id: "trip-c10",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(31),
      time: "12:00",
      meetAndGreet: false,
      dryRun: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.newTotal).toBeGreaterThan(60);
  });

  it("C11 return trip change", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    process.env.DISTANCE_MOCK = "1";
    await PricingRule.create({
      extras: { meetGreet: { enabled: false, price: 0 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c11",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      tripType: "roundtrip",
      returnDate: dayOffset(31),
      returnTime: "14:00",
      bookingType: "destination",
      totalAmount: 100,
      amountPaidCents: 10000,
    });
    const result = await applyCustomerTripAction({
      id: "trip-c11",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(32),
      time: "10:00",
      dryRun: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(typeof result.newTotal).toBe("number");
  });

  it("C12 cancel after change refund = netPaid - fee", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    await Setting.create({ cancelPolicy: [{ hoursBefore: 1000, feePercent: 10 }], timezone: "UTC" });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c12",
      status: "upcoming",
      date: dayOffset(1),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: true,
      totalAmount: 70,
      amountPaidCents: 7000,
    });
    await applyCustomerTripAction({
      id: "trip-c12",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(1),
      time: "12:00",
      meetAndGreet: false,
      baseUrl: "http://localhost:3000",
    });
    const result = await applyCustomerTripAction({
      id: "trip-c12",
      email: "ada@example.com",
      action: "cancel",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // netPaid = 70 - 10 (pending refund) = 60; newest total 60; fee 10% = 6; refund = 54
    expect(result.refundAmount).toBeCloseTo(54, 2);
  });

  it("C13 cancel with pending pay link invalidates it", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c13",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
      amountPaidCents: 6000,
    });
    await applyCustomerTripAction({
      id: "trip-c13",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: true,
      baseUrl: "http://localhost:3000",
    });
    const before = await Booking.findOne({ tripId: "trip-c13" });
    expect(before?.pendingChange).toBeTruthy();
    const result = await applyCustomerTripAction({
      id: "trip-c13",
      email: "ada@example.com",
      action: "cancel",
    });
    expect(result.ok).toBe(true);
    const after = await Booking.findOne({ tripId: "trip-c13" });
    expect(after?.pendingChange).toBeUndefined();
    expect(after?.paymentTokenHash).toBeUndefined();
  });

  it("C14 cash/bank cancel no refund", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await Setting.create({ cancelPolicy: [{ hoursBefore: 24, feePercent: 10 }], timezone: "UTC" });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c14",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      totalAmount: 100,
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      amountPaidCents: 0,
    });
    const result = await applyCustomerTripAction({
      id: "trip-c14",
      email: "ada@example.com",
      action: "cancel",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.refundAmount).toBe(0);
    expect(result.refundRequestId).toBeFalsy();
    const count = await RefundRequest.countDocuments({ tripId: "trip-c14" });
    expect(count).toBe(0);
  });

  it("C15 concurrent change+cancel one wins", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c15",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
      amountPaidCents: 6000,
    });
    const [a, b] = await Promise.all([
      applyCustomerTripAction({ id: "trip-c15", email: "ada@example.com", action: "change", date: dayOffset(30), time: "12:00", meetAndGreet: true, baseUrl: "http://localhost:3000" }),
      applyCustomerTripAction({ id: "trip-c15", email: "ada@example.com", action: "cancel" }),
    ]);
    const successes = [a, b].filter((r) => r.ok).length;
    expect(successes).toBe(1);
  });

  it("C16 minor units no float drift", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 0.1 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c16",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 0.1 + 0.2,
      amountPaidCents: Math.round((0.1 + 0.2) * 100),
    });
    const result = await applyCustomerTripAction({
      id: "trip-c16",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: true,
      dryRun: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // no float drift: amount should be exact cents
    expect(Number.isFinite(result.amount as number)).toBe(true);
    expect(Math.round((result.amount as number) * 100)).toBe(result.amount! * 100);
  });

  it("C17 notifications to customer/desk/driver", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c17",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: false,
      totalAmount: 60,
      amountPaidCents: 6000,
      assignedDriver: { _id: new mongoose.Types.ObjectId(), name: "Driver", email: "driver@example.com" },
    });
    await applyCustomerTripAction({
      id: "trip-c17",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: true,
      baseUrl: "http://localhost:3000",
    });
    expect(notify).toHaveBeenCalledWith("booking_changed", expect.anything());
    // cancel notification
    await applyCustomerTripAction({
      id: "trip-c17",
      email: "ada@example.com",
      action: "cancel",
    });
    expect(notify).toHaveBeenCalledWith("booking_cancelled", expect.anything());
  });

  it("C18 partner payout adjusted/zeroed", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await PricingRule.create({
      extras: { meetGreet: { enabled: true, price: 10 }, childSeat: { enabled: false, price: 0 }, babySeat: { enabled: false, price: 0 } },
    });
    const vehicle = await createVehicle();
    await createRide({
      selectedVehicle: vehicle._id,
      tripId: "trip-c18",
      status: "upcoming",
      date: dayOffset(30),
      time: "12:00",
      bookingType: "hourly",
      duration: 2,
      meetAndGreet: true,
      totalAmount: 70,
      amountPaidCents: 7000,
      partnerPayoutAmount: 50,
      partnerMarginAmount: 10,
    });
    await applyCustomerTripAction({
      id: "trip-c18",
      email: "ada@example.com",
      action: "change",
      date: dayOffset(30),
      time: "12:00",
      meetAndGreet: false,
      baseUrl: "http://localhost:3000",
    });
    const booking = await Booking.findOne({ tripId: "trip-c18" });
    expect(booking?.partnerPayoutAmount).toBeLessThan(50);
    // cancel zeros
    await applyCustomerTripAction({
      id: "trip-c18",
      email: "ada@example.com",
      action: "cancel",
    });
    const after = await Booking.findOne({ tripId: "trip-c18" });
    expect(after?.partnerPayoutAmount).toBe(0);
    expect(after?.partnerMarginAmount).toBe(0);
  });
});