import type { IBooking } from "@/features/booking/model";
import type { BookingPatchApplyResult } from "@/features/booking/lib/booking-patch-result";
import { detachIncompleteQuoteIntent } from "@/features/payments/lib/quote-payment-intent";
import { assertMultisafepayNotPaid } from "@/features/payments/lib/multisafepay-payment-state";

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

  const depositPaidCents = Math.max(
    0,
    Number(booking.depositPaidCents ?? booking.amountPaidCents) || 0,
  );
  const hasDeposit = depositPaidCents > 0;

  // A paid deposit is a separate payment from the quote intent; keep it.
  if (!hasDeposit) {
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

  updateData.status = "upcoming";
  updateData.paymentMethod = "cash";
  updateData.paymentStatus = hasDeposit ? "completed" : "pending";
  updateData.totalAmount = Number(amount.toFixed(2));
  updateData.balanceDue = Math.max(
    0,
    Number((amount - depositPaidCents / 100).toFixed(2))
  );
  if (typeof booking.quotedAmount !== "number") {
    updateData.quotedAmount = Number(amount.toFixed(2));
    updateData.quotedAt = new Date();
  }

  // multisafepayOrderId is intentionally kept: if the customer pays that order
  // anyway, the webhook can still match the booking and refuse it loudly.
  return {
    ok: true,
    updateData,
    unsetFields: hasDeposit
      ? ["paymentTokenHash"]
      : ["paymentTokenHash", "stripePaymentIntentId"],
  };
}
