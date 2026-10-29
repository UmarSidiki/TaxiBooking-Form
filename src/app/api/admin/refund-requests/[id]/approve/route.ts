import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { RefundRequest } from "@/features/booking/model";
import { Booking } from "@/features/booking/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { getStripeClient } from "@/features/payments/lib/stripe-client";
import { jsonError } from "@/shared/http/json-error";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  await connectDB();
  const { id } = await params;
  const refundRequest = await RefundRequest.findById(id);
  if (!refundRequest) return jsonError("not_found", 404);

  if (refundRequest.status !== "pending") {
    return NextResponse.json({ ok: true, status: refundRequest.status }, { status: 200 });
  }

  const booking = await Booking.findById(refundRequest.bookingId);
  const stripe = await getStripeClient();

  if (!booking?.stripePaymentIntentId || !stripe) {
    return jsonError("stripe_unavailable", 409);
  }
  {
    const amountCents = Math.round(refundRequest.amount * 100);
    const refund = await stripe.refunds.create(
      {
        payment_intent: booking.stripePaymentIntentId,
        amount: amountCents,
        reason: "requested_by_customer",
        metadata: { refund_request_id: String(refundRequest._id) },
      },
      { idempotencyKey: `refund_${String(refundRequest._id)}` }
    );
    refundRequest.stripeRefundId = refund.id;
  }

  refundRequest.status = "refunded";
  await refundRequest.save();

  if (booking) {
    booking.refundAmount = (booking.refundAmount ?? 0) + refundRequest.amount;
    booking.amountRefundedCents = (booking.amountRefundedCents ?? 0) + (refundRequest.amountCents ?? Math.round(refundRequest.amount * 100));
    if (refundRequest.reason === "cancellation") booking.paymentStatus = "refunded";
    await booking.save();
  }

  return NextResponse.json({ ok: true, status: refundRequest.status, refundRequest });
}
