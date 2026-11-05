import type { IBooking } from "@/features/booking/model";
import RefundRequest from "@/features/booking/model/RefundRequest";
import { Setting } from "@/features/settings/model";
import { refundStripePaymentIntent } from "@/features/payments/lib/process-stripe-refund";
import { refundableDepositCents } from "@/features/payments/lib/refundable-deposit";

export type DepositRefundResult =
  | { ok: true; refundAmount: number; refundedCents: number; warn?: string }
  | { ok: false; message: string };

/**
 * Refunds an online deposit paid for a cash booking or appointment request.
 * Stripe is refunded automatically; MultiSafepay creates a RefundRequest for
 * manual completion because its refund API requires the original cart items.
 */
export async function refundDeposit(booking: IBooking): Promise<DepositRefundResult> {
  const cents = refundableDepositCents(booking);
  if (cents <= 0) {
    return { ok: true, refundAmount: 0, refundedCents: 0 };
  }

  const paymentIntentId =
    booking.depositPaymentIntentId ?? booking.stripePaymentIntentId;

  if (paymentIntentId) {
    const settings = await Setting.findOne();
    const result = await refundStripePaymentIntent({
      paymentIntentId,
      amountCents: cents,
      settings,
      metadata: {
        booking_id: booking._id?.toString() ?? "",
        trip_id: booking.tripId,
        kind: "deposit",
      },
    });
    if (!result.success) {
      return { ok: false, message: result.error ?? "Refund failed" };
    }
    return {
      ok: true,
      refundAmount: result.refundAmount ?? cents / 100,
      refundedCents: cents,
    };
  }

  if (booking.multisafepayOrderId) {
    const existing = await RefundRequest.findOne({
      bookingId: booking._id,
      reason: "cancellation",
      status: "pending",
    });
    if (!existing) {
      await RefundRequest.create({
        bookingId: booking._id,
        tripId: booking.tripId,
        amount: cents / 100,
        amountCents: cents,
        reason: "cancellation",
        status: "pending",
      });
    }
    return {
      ok: true,
      refundAmount: 0,
      refundedCents: 0,
      warn: "Refund the MultiSafepay deposit from the MultiSafepay dashboard; a refund request was recorded.",
    };
  }

  return { ok: true, refundAmount: 0, refundedCents: 0 };
}
