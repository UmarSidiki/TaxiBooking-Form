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
      currentTotal?: number;
      newTotal?: number;
      paid?: number;
      difference?: number;
      action?: "pay" | "refund" | "none" | "balance_due";
      amount?: number;
      dryRun?: boolean;
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

function toCents(value: number) {
  return Math.round(value * 100);
}

function isCardPaid(booking: IBooking) {
  return (
    (booking.paymentMethod === "stripe" || booking.paymentMethod === "multisafepay") &&
    booking.paymentStatus === "completed"
  );
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

async function netPaidCents(booking: IBooking) {
  if (booking.amountPaidCents == null && isCardPaid(booking)) {
    booking.amountPaidCents = toCents(booking.totalAmount ?? 0);
  }
  if (booking.amountRefundedCents == null) {
    booking.amountRefundedCents = toCents(booking.refundAmount ?? 0);
  }
  const pending = await RefundRequest.find({ bookingId: booking._id, status: "pending" }).lean();
  const pendingCents = pending.reduce((sum, r: any) => sum + toCents(r.amount ?? 0), 0);
  return (booking.amountPaidCents ?? 0) - (booking.amountRefundedCents ?? 0) - pendingCents;
}

export async function applyCustomerTripAction(input: {
  id: string;
  email: string;
  action: CustomerTripAction;
  date?: string;
  time?: string;
  pickup?: string;
  dropoff?: string;
  selectedVehicle?: string;
  passengers?: number;
  childSeats?: number;
  babySeats?: number;
  meetAndGreet?: boolean;
  baseUrl?: string;
  dryRun?: boolean;
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
    return cancelTrip(booking, input.baseUrl, input.dryRun ?? false);
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

  return changeTrip(
    booking,
    {
      date,
      time,
      pickup: input.pickup,
      dropoff: input.dropoff,
      selectedVehicle: input.selectedVehicle,
      passengers: input.passengers,
      childSeats: input.childSeats,
      babySeats: input.babySeats,
      meetAndGreet: input.meetAndGreet,
    },
    input.baseUrl,
    input.dryRun ?? false,
  );
}

async function cancelTrip(
  booking: IBooking,
  baseUrl?: string,
  dryRun = false,
): Promise<CustomerTripActionResult> {
  const tz = await operatorTimezone();
  const instant = zonedRideInstant(booking.date, booking.time, tz);
  const hoursUntil = instant ? (instant.getTime() - Date.now()) / (60 * 60 * 1000) : 0;

  const settings = await Setting.findOne().lean();
  const policy = normalizeCancelPolicy(settings?.cancelPolicy);
  const total = typeof booking.totalAmount === "number" ? booking.totalAmount : 0;

  if (booking.amountPaidCents == null) {
    booking.amountPaidCents = isCardPaid(booking) ? toCents(total) : 0;
  }
  if (booking.amountRefundedCents == null) {
    booking.amountRefundedCents = toCents(booking.refundAmount ?? 0);
  }
  const netPaid = await netPaidCents(booking);

  const { feePercent, feeAmount } = computeCancelFee(policy, total, hoursUntil);
  const feeCents = toCents(feeAmount);
  const refundCents = Math.max(0, netPaid - feeCents);
  const refundAmount = refundCents / 100;

  const isCard = isCardPaid(booking);
  const cashUnpaid = !isCard;

  if (dryRun) {
    return {
      ok: true,
      status: booking.status ?? "upcoming",
      date: booking.date,
      time: booking.time,
      totalAmount: total,
      fee: feeAmount,
      refundAmount: isCard ? refundAmount : 0,
      currentTotal: total,
      newTotal: total,
      paid: netPaid / 100,
      difference: 0,
      action:
        isCard && refundCents > 0
          ? "refund"
          : cashUnpaid && feeCents > 0
            ? "balance_due"
            : "none",
      amount:
        isCard && refundCents > 0
          ? refundAmount
          : cashUnpaid && feeCents > 0
            ? feeAmount
            : 0,
      dryRun: true,
    };
  }

  // Release driver assignment.
  booking.assignedDriver = undefined;

  // Invalidate pending pay link.
  booking.paymentTokenHash = undefined;
  booking.pendingChange = undefined;

  // Partner/driver ledger: zero payout on cancel.
  if (booking.partnerPayoutAmount != null) booking.partnerPayoutAmount = 0;
  if (booking.partnerMarginAmount != null) booking.partnerMarginAmount = 0;

  const currentVersion = (booking as any).__v;

  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: { $in: MODIFIABLE_STATUSES }, __v: currentVersion },
    {
      $set: {
        status: "canceled",
        canceledAt: new Date(),
        assignedDriver: undefined,
        partnerPayoutAmount: 0,
        partnerMarginAmount: 0,
        amountPaidCents: booking.amountPaidCents,
        amountRefundedCents: booking.amountRefundedCents,
        updatedAt: new Date(),
      },
      $unset: { paymentTokenHash: 1, pendingChange: 1 },
      $inc: { __v: 1 },
    },
    { new: true },
  );

  if (!updated) {
    const fresh = await Booking.findById(booking._id);
    if (fresh && CANCELED_STATUSES.includes(fresh.status ?? "")) {
      return okResult(fresh);
    }
    return { ok: false, status: 409, error: "conflict" };
  }

  booking.status = "canceled";
  booking.canceledAt = updated.canceledAt;

  // Create RefundRequest for card-paid bookings (no automatic refund).
  let refundRequestId: string | undefined;
  if (isCard && refundCents > 0) {
    const existing = await RefundRequest.findOne({
      bookingId: booking._id,
      reason: "cancellation",
      status: "pending",
    });
    if (existing) {
      refundRequestId = String(existing._id);
    } else {
      const created = await RefundRequest.create({
        bookingId: booking._id,
        tripId: booking.tripId,
        amount: refundAmount,
        amountCents: refundCents,
        reason: "cancellation",
        status: "pending",
      });
      refundRequestId = String(created._id);
    }
  }

  const resolvedBase = baseUrl ?? (await resolvePublicUrl().then((url) => url ?? undefined));
  const ctx = await buildNotifyContext(booking, resolvedBase);
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
    totalAmount: total,
    fee: feeAmount,
    refundAmount: isCard ? refundAmount : 0,
    refundRequestId,
    currentTotal: total,
    newTotal: total,
    paid: netPaid / 100,
    difference: 0,
    action:
      isCard && refundCents > 0
        ? "refund"
        : cashUnpaid && feeCents > 0
          ? "balance_due"
          : "none",
    amount:
      isCard && refundCents > 0
        ? refundAmount
        : cashUnpaid && feeCents > 0
          ? feeAmount
          : 0,
  };
}

type ChangeInput = { date: string; time: string; pickup?: string; dropoff?: string; selectedVehicle?: string; passengers?: number; childSeats?: number; babySeats?: number; meetAndGreet?: boolean };

/** True when any field that feeds the fare differs from the booking. Omitted fields count as unchanged. */
export function priceAffectingChange(booking: IBooking, input: ChangeInput): boolean {
  const differs = (next: unknown, current: unknown) => {
    if (next === undefined || next === null || next === "") return false;
    if (typeof next === "boolean" || typeof current === "boolean") return Boolean(next) !== Boolean(current);
    if (typeof next === "number") return next !== Number(current ?? 0);
    return String(next).trim() !== String(current ?? "").trim();
  };
  const b = booking as any;
  return (
    differs(input.date, b.date) ||
    differs(input.time, b.time) ||
    differs(input.pickup, b.pickup) ||
    differs(input.dropoff, b.dropoff) ||
    differs(input.selectedVehicle, b.selectedVehicle) ||
    differs(input.passengers, b.passengers) ||
    differs(input.childSeats, b.childSeats) ||
    differs(input.babySeats, b.babySeats) ||
    differs(input.meetAndGreet, b.meetAndGreet)
  );
}

/** The booking's own price snapshot, used when nothing price-affecting changed. */
function keepOriginalPrice(booking: IBooking) {
  const b = booking as any;
  const snapshot: Record<string, unknown> = {
    date: b.date,
    time: b.time,
    pickup: b.pickup,
    dropoff: b.dropoff,
    selectedVehicle: b.selectedVehicle ? String(b.selectedVehicle) : undefined,
    passengers: b.passengers,
    childSeats: b.childSeats,
    babySeats: b.babySeats,
    meetAndGreet: b.meetAndGreet,
    totalAmount: b.totalAmount,
    subtotalAmount: b.subtotalAmount,
    taxAmount: b.taxAmount,
    taxPercentage: b.taxPercentage,
    depositDue: b.depositDue,
    balanceDue: b.balanceDue,
    fareLines: b.fareLines,
    promoCode: b.promoCode,
  };
  for (const key of Object.keys(snapshot)) if (snapshot[key] === undefined) delete snapshot[key];
  return snapshot as Awaited<ReturnType<typeof repriceCustomerTrip>> & object;
}

async function changeTrip(
  booking: IBooking,
  input: { date: string; time: string; pickup?: string; dropoff?: string; selectedVehicle?: string; passengers?: number; childSeats?: number; babySeats?: number; meetAndGreet?: boolean },
  baseUrl?: string,
  dryRun = false,
): Promise<CustomerTripActionResult> {
  // Invalidate expired pending pay link.
  if (booking.pendingChange?.expiresAt && new Date(booking.pendingChange.expiresAt).getTime() < Date.now()) {
    booking.pendingChange = undefined;
    booking.paymentTokenHash = undefined;
  }

  const repriced = priceAffectingChange(booking, input)
    ? await repriceCustomerTrip(booking, input)
    : keepOriginalPrice(booking);
  if (!repriced) {
    return { ok: false, status: 409, error: "not_modifiable", reason: "fare" };
  }

  const oldTotal = typeof booking.totalAmount === "number" ? booking.totalAmount : 0;
  const newTotal = typeof repriced.totalAmount === "number" ? repriced.totalAmount : oldTotal;
  const oldCents = toCents(oldTotal);
  const newCents = toCents(newTotal);

  if (booking.amountPaidCents == null) {
    booking.amountPaidCents = isCardPaid(booking) ? oldCents : 0;
  }
  if (booking.amountRefundedCents == null) {
    booking.amountRefundedCents = toCents(booking.refundAmount ?? 0);
  }

  const netPaid = await netPaidCents(booking);
  const isCard = isCardPaid(booking);

  const priceDiffCents = newCents - oldCents;

  let action: "pay" | "refund" | "none" | "balance_due" = "none";
  let amountCents = 0;

  if (isCard) {
    if (newCents < netPaid) {
      action = "refund";
      amountCents = netPaid - newCents;
    } else if (newCents > netPaid) {
      action = "pay";
      amountCents = newCents - netPaid;
    } else {
      action = "none";
      amountCents = 0;
    }
  } else {
    const balanceCents = newCents - netPaid;
    if (balanceCents !== 0) {
      action = "balance_due";
      amountCents = Math.abs(balanceCents);
    } else {
      action = "none";
      amountCents = 0;
    }
  }

  if (dryRun) {
    return {
      ok: true,
      status: booking.status ?? "upcoming",
      date: repriced.date ?? booking.date,
      time: repriced.time ?? booking.time,
      totalAmount: newTotal,
      currentTotal: oldTotal,
      newTotal,
      paid: netPaid / 100,
      difference: priceDiffCents / 100,
      action,
      amount: amountCents / 100,
      dryRun: true,
    };
  }

  const resolvedBase = baseUrl ?? (await resolvePublicUrl().then((url) => url ?? undefined));

  // A new change request replaces/invalidates a previous pending pay link.
  const hadPending = !!booking.pendingChange;
  if (hadPending) {
    booking.paymentTokenHash = undefined;
    booking.pendingChange = undefined;
  }

  const currentVersion = (booking as any).__v;

  if (isCard && newCents > netPaid) {
    // DO NOT apply change; store pendingChange + pay link for exactly the diff.
    const { token, hash } = mintPaymentToken();
    const diffForPay = newCents - netPaid;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const proposed = { ...repriced };
    booking.paymentTokenHash = hash;
    booking.pendingChange = {
      newTotalCents: newCents,
      diffCents: diffForPay,
      payLinkId: token,
      expiresAt,
      proposed,
      createdAt: new Date(),
    };

    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: { $in: MODIFIABLE_STATUSES }, __v: currentVersion },
      {
        $set: {
          paymentTokenHash: hash,
          pendingChange: booking.pendingChange,
          status: "awaiting_payment",
          quotedAmount: diffForPay / 100,
          amountPaidCents: booking.amountPaidCents,
          amountRefundedCents: booking.amountRefundedCents,
          updatedAt: new Date(),
        },
        $inc: { __v: 1 },
      },
      { new: true },
    );

    if (!updated) {
      return { ok: false, status: 409, error: "conflict" };
    }

    const payUrl = quotePayUrl(resolvedBase, booking.locale, token);

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
      totalAmount: oldTotal,
      payUrl,
      currentTotal: oldTotal,
      newTotal,
      paid: netPaid / 100,
      difference: priceDiffCents / 100,
      action: "pay",
      amount: diffForPay / 100,
    };
  }

  // Applied change (card decrease/equal or cash/bank unpaid).
  const setFields: any = {
    ...repriced,
    amountPaidCents: booking.amountPaidCents,
    amountRefundedCents: booking.amountRefundedCents,
    updatedAt: new Date(),
  };
  if (input.passengers !== undefined) setFields.passengers = input.passengers;
  if (input.childSeats !== undefined) setFields.childSeats = input.childSeats;
  if (input.babySeats !== undefined) setFields.babySeats = input.babySeats;
  if (input.meetAndGreet !== undefined) setFields.meetAndGreet = input.meetAndGreet;

  // Adjust partner payout/margin proportionally to the new total.
  if (booking.partnerPayoutAmount != null && oldCents > 0) {
    const ratio = newCents / oldCents;
    setFields.partnerPayoutAmount = round2(booking.partnerPayoutAmount * ratio);
  }
  if (booking.partnerMarginAmount != null && oldCents > 0) {
    const ratio = newCents / oldCents;
    setFields.partnerMarginAmount = round2(booking.partnerMarginAmount * ratio);
  }

  // Create RefundRequest for card decrease.
  let refundRequestId: string | undefined;
  if (isCard && newCents < netPaid) {
    const refundAmountMajor = (netPaid - newCents) / 100;
    const refundCentsVal = netPaid - newCents;
    const existing = await RefundRequest.findOne({
      bookingId: booking._id,
      reason: "booking_change",
      status: "pending",
    });
    if (existing) {
      refundRequestId = String(existing._id);
    } else {
      const created = await RefundRequest.create({
        bookingId: booking._id,
        tripId: booking.tripId,
        amount: refundAmountMajor,
        amountCents: refundCentsVal,
        reason: "booking_change",
        status: "pending",
      });
      refundRequestId = String(created._id);
    }
  }

  if (hadPending) {
    setFields.pendingChange = undefined;
  }
  setFields.paymentTokenHash = undefined;

  const updatePayload: any = {
    $set: setFields,
    $inc: { __v: 1 },
  };
  if (hadPending) {
    updatePayload.$unset = { pendingChange: 1, paymentTokenHash: 1 };
  }

  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: { $in: MODIFIABLE_STATUSES }, __v: currentVersion },
    updatePayload,
    { new: true },
  );

  if (!updated) {
    return { ok: false, status: 409, error: "conflict" };
  }

  booking.set({ ...setFields });
  if (hadPending) booking.pendingChange = undefined;
  booking.paymentTokenHash = undefined;

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
    refundRequestId,
    currentTotal: oldTotal,
    newTotal,
    paid: netPaid / 100,
    difference: priceDiffCents / 100,
    action,
    amount: amountCents / 100,
  };
}

function okResult(booking: IBooking): CustomerTripActionResult {
  return {
    ok: true,
    status: booking.status ?? "upcoming",
    date: booking.date,
    time: booking.time,
    totalAmount: booking.totalAmount,
    currentTotal: booking.totalAmount,
    newTotal: booking.totalAmount,
    paid: (booking.amountPaidCents ?? 0) / 100,
  };
}