import type { IBooking } from "@/features/booking/model";
import type { BookingPatchApplyResult } from "@/features/booking/lib/booking-patch-result";
import { detachIncompleteQuoteIntent } from "@/features/payments/lib/quote-payment-intent";
import { assertMultisafepayNotPaid } from "@/features/payments/lib/multisafepay-payment-state";
import { refundDeposit } from "@/features/payments/lib/refund-deposit";
import { refundableDepositCents } from "@/features/payments/lib/refundable-deposit";

export async function applyDeclineRequest(
  booking: IBooking,
  declineReason: unknown,
  updateData: Partial<IBooking>
): Promise<BookingPatchApplyResult> {
  if (booking.status !== "requested" && booking.status !== "awaiting_payment") {
    return {
      ok: false,
      status: 400,
      message: "Only appointment requests can be declined",
    };
  }

  const reason =
    typeof declineReason === "string" ? declineReason.trim().slice(0, 500) : "";

  const depositCents = refundableDepositCents(booking);
  let warn: string | undefined;

  if (depositCents > 0) {
    // The paid deposit replaces the quote intent; refund it instead of blocking.
    const refund = await refundDeposit(booking);
    if (!refund.ok) {
      return { ok: false, status: 500, message: refund.message };
    }
    if (refund.refundedCents > 0) {
      updateData.refundAmount =
        (Number(booking.refundAmount) || 0) + refund.refundAmount;
      updateData.amountRefundedCents =
        (Number(booking.amountRefundedCents) || 0) + refund.refundedCents;
      updateData.paymentStatus = "refunded";
    }
    updateData.balanceDue = 0;
    warn = refund.warn;
  } else {
    const detached = await detachIncompleteQuoteIntent(
      booking.stripePaymentIntentId
    );
    if (!detached.ok) {
      return { ok: false, status: 409, message: detached.message };
    }

    const multisafepay = await assertMultisafepayNotPaid(
      booking.multisafepayOrderId
    );
    if (!multisafepay.ok) {
      return { ok: false, status: 409, message: multisafepay.message };
    }
  }

  updateData.status = "canceled";
  updateData.declinedAt = new Date();
  updateData.canceledAt = new Date();
  if (reason) {
    updateData.declineReason = reason;
  }

  // Provider ids are kept for audit/refunds; keeping multisafepayOrderId also
  // lets a late payment match the booking and be refused instead of vanishing.
  return {
    ok: true,
    updateData,
    unsetFields:
      depositCents > 0
        ? ["paymentTokenHash"]
        : ["paymentTokenHash", "stripePaymentIntentId"],
    warn,
  };
}
