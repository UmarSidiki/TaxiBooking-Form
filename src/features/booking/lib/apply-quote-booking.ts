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

  const detached = await detachIncompleteQuoteIntent(
    booking.stripePaymentIntentId
  );
  if (!detached.ok) {
    return { ok: false, status: 409, message: detached.message };
  }

  const { token, hash } = mintPaymentToken();

  updateData.quotedAmount = Number(amount.toFixed(2));
  updateData.totalAmount = Number(amount.toFixed(2));
  updateData.quotedAt = new Date();
  updateData.status = "awaiting_payment";
  updateData.paymentTokenHash = hash;
  updateData.paymentStatus = "pending";
  updateData.quoteEmailSent = false;

  return {
    ok: true,
    updateData,
    unsetFields: ["stripePaymentIntentId"],
    paymentToken: token,
  };
}
