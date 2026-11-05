import type { IBooking } from "@/features/booking/model";
import type { BookingPatchApplyResult } from "@/features/booking/lib/booking-patch-result";
import { mintPaymentToken } from "@/features/booking/lib/payment-token";
import { detachIncompleteQuoteIntent } from "@/features/payments/lib/quote-payment-intent";

export async function applyQuoteBooking(
  booking: IBooking,
  quotedAmount: unknown,
  updateData: Partial<IBooking>
): Promise<BookingPatchApplyResult & { paymentToken?: string }> {
  if (booking.status !== "requested" && booking.status !== "awaiting_payment") {
    return {
      ok: false,
      status: 400,
      message: "Only appointment requests can be quoted",
    };
  }

  const amount =
    quotedAmount !== undefined && quotedAmount !== null
      ? Number(quotedAmount)
      : Number(booking.estimatedAmount ?? booking.totalAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      status: 400,
      message:
        "Quoted amount must be greater than zero. Use confirm as cash for a free ride.",
    };
  }

  const depositPaidCents = Math.max(
    0,
    Number(booking.depositPaidCents ?? booking.amountPaidCents) || 0,
  );
  const hasDeposit = depositPaidCents > 0;

  // A paid deposit PaymentIntent must be preserved for refunds; only a
  // pending quote intent is detached here.
  if (!hasDeposit) {
    const detached = await detachIncompleteQuoteIntent(
      booking.stripePaymentIntentId
    );
    if (!detached.ok) {
      return { ok: false, status: 409, message: detached.message };
    }
  }

  if (hasDeposit && Math.round(amount * 100) < depositPaidCents) {
    return {
      ok: false,
      status: 400,
      message:
        "Quoted amount cannot be less than the deposit already paid. Refund the deposit or quote at least that amount.",
    };
  }

  const balance = Math.max(0, Number((amount - depositPaidCents / 100).toFixed(2)));

  // The deposit already covers the quote: confirm without a balance link.
  if (hasDeposit && balance <= 0) {
    updateData.quotedAmount = Number(amount.toFixed(2));
    updateData.totalAmount = Number(amount.toFixed(2));
    updateData.quotedAt = new Date();
    updateData.status = "upcoming";
    updateData.paymentStatus = "completed";
    updateData.balanceDue = 0;
    return {
      ok: true,
      updateData,
      unsetFields: ["paymentTokenHash"],
    };
  }

  const { token, hash } = mintPaymentToken();

  updateData.quotedAmount = Number(amount.toFixed(2));
  updateData.totalAmount = Number(amount.toFixed(2));
  updateData.quotedAt = new Date();
  updateData.status = "awaiting_payment";
  updateData.paymentTokenHash = hash;
  updateData.paymentStatus = hasDeposit ? "completed" : "pending";
  updateData.balanceDue = balance;
  updateData.quoteEmailSent = false;

  return {
    ok: true,
    updateData,
    unsetFields: hasDeposit ? [] : ["stripePaymentIntentId"],
    paymentToken: token,
  };
}
