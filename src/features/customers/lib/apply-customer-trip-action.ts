import mongoose from "mongoose";
import { Booking, type IBooking, RefundRequest } from "@/features/booking/model";
import { changeAllowed } from "@/features/customers/lib/customer-rides";
import { repriceCustomerTrip } from "@/features/customers/lib/reprice-customer-trip";
import { zonedRideInstant } from "@/features/booking/lib/send-pickup-reminders";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { notify } from "@/features/notifications/notify";
import { mintPaymentToken } from "@/features/booking/lib/payment-token";
import { quotePayUrl } from "@/features/booking/lib/quote-pay-url";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { getStripeClient } from "@/features/payments/lib/stripe-client";
import { computeCancelFee, normalizeCancelPolicy } from "@/features/customers/lib/cancel-policy";

export type CustomerTripAction = "cancel" | "change";

export type CustomerTripActionResult =
  | {
      ok: true;
      status: string;
      date: string;
      time: string;
      totalAmount?: number;
      payUrl?: string;
      refundRequestId?: string;
      fee?: number;
      refundAmount?: number;
    }
  | { ok: false; status: number; error: string; reason?: string };

const MODIFIABLE_STATUSES = ["requested", "awaiting_payment", "upcoming"];
const CANCELED_STATUSES = ["canceled", "cancelled"];
const PENDING_STATUSES = ["requested", "awaiting_payment"];

function emailPattern(email: string) {
  return new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

async function findOwnedTrip(id: string, email: string): Promise<IBooking | null> {
  return Booking.findOne({ tripId: id, email: emailPattern(email) });
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

async function operatorTimezone() {
  const settings = await Setting.findOne().select("timezone").lean<{ timezone?: string }>();
  return settings?.timezone || "Europe/Zurich";
}

async function buildNotifyContext(booking: IBooking, baseUrl?: string) {
  const recipients: Record<string, Array<{ phone?: string | null; email?: string | null; name?: string; whatsappOptIn?: boolean }>> = {};
  recipients.customer = [
    {
      phone: booking.phone,
      email: booking.email,
      name: `${booking.firstName} ${booking.lastName}`.trim(),
      whatsappOptIn: booking.whatsappOptIn,
    },
  ];
  if (booking.assignedDriver?.email) {
    recipients.driver = [
      { email: booking.assignedDriver.email, name: booking.assignedDriver.name },
    ];
  }
  if (booking.assignedPartner?.email) {
    recipients.partner = [
      { email: booking.assignedPartner.email, name: booking.assignedPartner.name },
    ];
  }
  const resolvedBase = baseUrl ?? (await resolvePublicUrl().then((url) => url ?? undefined));
  return {
    locale: booking.locale || "en",
    baseUrl: resolvedBase,
    customerEmail: booking.email,
    bookingId: String(booking._id),
    variables: {
      name: `${booking.firstName} ${booking.lastName}`.trim(),
      tripId: booking.tripId,
      pickup: booking.pickup,
      dropoff: booking.dropoff || "",
      date: booking.date,
      time: booking.time,
      total: booking.totalAmount,
    },
    recipients: recipients as any,
  };
}

export async function applyCustomerTripAction(input: {
  id: string;
  email: string;
  action: CustomerTripAction;
  date?: string;
  time?: string;
  passengers?: number;
  childSeats?: number;
  babySeats?: number;
  meetAndGreet?: boolean;
  baseUrl?: string;
}): Promise<CustomerTripActionResult> {
  await connectDB();
  const booking = await findOwnedTrip(input.id, input.email);
  if (!booking) return { ok: false, status: 404, error: "not_found" };

  if (
    input.action === "cancel" &&
    CANCELED_STATUSES.includes(booking.status ?? "")
  ) {
    return okResult(booking);
  }

  if (!MODIFIABLE_STATUSES.includes(booking.status ?? "")) {
    return { ok: false, status: 409, error: "not_modifiable", reason: "status" };
  }

  if (!(await changeAllowed(booking))) {
    return { ok: false, status: 409, error: "not_modifiable", reason: "cutoff" };
  }

  if (input.action === "cancel") {
    return cancelTrip(booking, input.baseUrl);
  }

  const date = input.date ?? booking.date;
  const time = input.time ?? booking.time;
  if (input.date && !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, status: 400, error: "invalid_body" };
  }
  if (input.time && !/^\d{2}:\d{2}$/.test(input.time)) {
    return { ok: false, status: 400, error: "invalid_body" };
  }

  const instant = zonedRideInstant(date, time, await operatorTimezone());
  if (!instant || instant.getTime() <= Date.now()) {
    return { ok: false, status: 409, error: "not_modifiable", reason: "past" };
  }

  return changeTrip(booking, {
    date,
    time,
    passengers: input.passengers,
    childSeats: input.childSeats,
    babySeats: input.babySeats,
    meetAndGreet: input.meetAndGreet,
  }, input.baseUrl);
}

async function cancelTrip(booking: IBooking, baseUrl?: string): Promise<CustomerTripActionResult> {
  const tz = await operatorTimezone();
  const instant = zonedRideInstant(booking.date, booking.time, tz);
  const hoursUntil = instant ? (instant.getTime() - Date.now()) / (60 * 60 * 1000) : 0;

  const settings = await Setting.findOne().lean();
  const policy = normalizeCancelPolicy(settings?.cancelPolicy);
  const total = typeof booking.totalAmount === "number" ? booking.totalAmount : 0;
  const { feePercent, feeAmount, refundAmount } = computeCancelFee(policy, total, hoursUntil);

  // Release driver assignment.
  booking.assignedDriver = undefined;

  // Create RefundRequest for Stripe-paid bookings (no automatic refund).
  let refundRequestId: string | undefined;
  if (booking.paymentMethod === "stripe" && booking.paymentStatus === "completed" && refundAmount > 0) {
    const existing = await RefundRequest.findOne({ bookingId: booking._id, reason: "cancellation" });
    if (existing) {
      refundRequestId = String(existing._id);
    } else {
      const created = await RefundRequest.create({
        bookingId: booking._id,
        tripId: booking.tripId,
        amount: refundAmount,
        reason: "cancellation",
        status: "pending",
      });
      refundRequestId = String(created._id);
    }
  }

  booking.status = "canceled";
  booking.canceledAt = new Date();
  booking.updatedAt = new Date();
  await booking.save();

  const ctx = await buildNotifyContext(booking, baseUrl);
  try {
    await notify("booking_cancelled", ctx);
  } catch (error) {
    console.error("Customer trip notification failed:", error);
  }

  return {
    ok: true,
    status: "canceled",
    date: booking.date,
    time: booking.time,
    totalAmount: booking.totalAmount,
    fee: feeAmount,
    refundAmount,
    refundRequestId,
  };
}

async function changeTrip(
  booking: IBooking,
  input: { date: string; time: string; passengers?: number; childSeats?: number; babySeats?: number; meetAndGreet?: boolean },
  baseUrl?: string
): Promise<CustomerTripActionResult> {
  const repriced = await repriceCustomerTrip(booking, input);
  if (!repriced) {
    return { ok: false, status: 409, error: "not_modifiable", reason: "fare" };
  }

  const oldTotal = typeof booking.totalAmount === "number" ? booking.totalAmount : 0;
  const newTotal = typeof repriced.totalAmount === "number" ? repriced.totalAmount : oldTotal;
  const diff = round2(newTotal - oldTotal);

  booking.set({ ...repriced, updatedAt: new Date() });
  // Preserve original pax/extras if not provided.
  if (input.passengers !== undefined) booking.passengers = input.passengers;
  if (input.childSeats !== undefined) booking.childSeats = input.childSeats;
  if (input.babySeats !== undefined) booking.babySeats = input.babySeats;
  if (input.meetAndGreet !== undefined) booking.meetAndGreet = input.meetAndGreet;

  let payUrl: string | undefined;
  let refundRequestId: string | undefined;

  const resolvedBase = baseUrl ?? (await resolvePublicUrl().then((url) => url ?? undefined));

  if (diff > 0) {
    const { token, hash } = mintPaymentToken();
    booking.paymentTokenHash = hash;
    payUrl = quotePayUrl(resolvedBase, booking.locale, token);
  } else if (diff < 0) {
    const refundAmount = round2(Math.abs(diff));
    if (booking.paymentMethod === "stripe" && booking.paymentStatus === "completed" && refundAmount > 0) {
      const existing = await RefundRequest.findOne({ bookingId: booking._id, reason: "booking_change" });
      if (existing) {
        refundRequestId = String(existing._id);
      } else {
        const created = await RefundRequest.create({
          bookingId: booking._id,
          tripId: booking.tripId,
          amount: refundAmount,
          reason: "booking_change",
          status: "pending",
        });
        refundRequestId = String(created._id);
      }
    }
  }

  await booking.save();

  const ctx = await buildNotifyContext(booking, resolvedBase);
  try {
    await notify("booking_changed", ctx);
  } catch (error) {
    console.error("Customer trip notification failed:", error);
  }

  return {
    ok: true,
    status: booking.status ?? "upcoming",
    date: booking.date,
    time: booking.time,
    totalAmount: newTotal,
    payUrl,
    refundRequestId,
  };
}

function okResult(booking: IBooking): CustomerTripActionResult {
  return {
    ok: true,
    status: booking.status ?? "upcoming",
    date: booking.date,
    time: booking.time,
    totalAmount: booking.totalAmount,
  };
}