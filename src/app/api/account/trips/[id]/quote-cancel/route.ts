import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { Setting } from "@/features/settings/model";
import { readCustomerToken } from "@/features/customers/lib/customer-token";
import { changeAllowed } from "@/features/customers/lib/customer-rides";
import { zonedRideInstant } from "@/features/booking/lib/send-pickup-reminders";
import { normalizeCancelPolicy, computeCancelFee } from "@/features/customers/lib/cancel-policy";

function emailPattern(email: string) {
  return new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const jar = await cookies();
  const email = readCustomerToken(
    new URL(request.url).searchParams.get("token") ||
      jar.get("customer_session")?.value
  );
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await Booking.findOne({ tripId: id, email: emailPattern(email) });
  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const settings = await Setting.findOne().lean();
  const tz = settings?.timezone || "Europe/Zurich";
  const instant = zonedRideInstant(booking.date, booking.time, tz);
  const hoursUntil = instant ? (instant.getTime() - Date.now()) / (60 * 60 * 1000) : 0;
  const policy = normalizeCancelPolicy(settings?.cancelPolicy);
  const total = typeof booking.totalAmount === "number" ? booking.totalAmount : 0;
  const { feePercent, feeAmount, refundAmount } = computeCancelFee(policy, total, hoursUntil);

  // net paid
  const isCard = booking.paymentMethod === "stripe" || booking.paymentMethod === "multisafepay";
  const amountPaidCents = booking.amountPaidCents ?? (isCard && booking.paymentStatus === "completed" ? Math.round(total * 100) : 0);
  const amountRefundedCents = booking.amountRefundedCents ?? Math.round((booking.refundAmount ?? 0) * 100);
  const { RefundRequest } = await import("@/features/booking/model");
  const pending = await RefundRequest.find({ bookingId: booking._id, status: "pending" }).lean();
  const pendingCents = pending.reduce((s: number, r: any) => s + Math.round((r.amount ?? 0) * 100), 0);
  const netPaidCents = amountPaidCents - amountRefundedCents - pendingCents;
  const paid = Math.max(0, netPaidCents) / 100;
  const feeCents = Math.round(feeAmount * 100);
  const refundCents = Math.max(0, netPaidCents - feeCents);

  return NextResponse.json({
    ok: true,
    tripId: booking.tripId,
    status: booking.status,
    totalAmount: total,
    paid,
    feePercent,
    feeAmount,
    refundAmount: refundCents / 100,
    listRefundAmount: refundAmount,
    hoursUntil,
    cancelPolicy: policy,
    modifiable: (await changeAllowed(booking)) && ["requested", "awaiting_payment", "upcoming"].includes(booking.status ?? ""),
  });
}