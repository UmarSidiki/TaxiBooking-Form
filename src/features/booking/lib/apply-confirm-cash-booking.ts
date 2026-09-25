import type { IBooking } from "@/features/booking/model";
import type { BookingPatchApplyResult } from "@/features/booking/lib/booking-patch-result";
import { detachIncompleteQuoteIntent } from "@/features/payments/lib/quote-payment-intent";

export async function applyConfirmCashBooking(
  booking: IBooking,
  updateData: Partial<IBooking>
): Promise<BookingPatchApplyResult> {
  if (booking.status !== "requested" && booking.status !== "awaiting_payment") {
    return {
      ok: false,
      status: 400,
      message: "Only appointment requests can be confirmed as cash",
    };
  }

  const amount = Number(
    booking.quotedAmount ?? booking.estimatedAmount ?? booking.totalAmount ?? 0
  );
  if (!Number.isFinite(amount) || amount < 0) {
    return {
      ok: false,
      status: 400,
      message: "Booking amount is missing",
    };
  }

  const detached = await detachIncompleteQuoteIntent(
    booking.stripePaymentIntentId
  );
  if (!detached.ok) {
    return { ok: false, status: 409, message: detached.message };
  }

  updateData.status = "upcoming";
  updateData.paymentMethod = "cash";
  updateData.paymentStatus = "pending";
  updateData.totalAmount = Number(amount.toFixed(2));
  if (typeof booking.quotedAmount !== "number") {
    updateData.quotedAmount = Number(amount.toFixed(2));
    updateData.quotedAt = new Date();
  }

  return {
    ok: true,
    updateData,
    unsetFields: ["paymentTokenHash", "stripePaymentIntentId", "multisafepayOrderId"],
  };
}
