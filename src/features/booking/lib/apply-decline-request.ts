import type { IBooking } from "@/features/booking/model";
import type { BookingPatchApplyResult } from "@/features/booking/lib/booking-patch-result";
import { detachIncompleteQuoteIntent } from "@/features/payments/lib/quote-payment-intent";

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

  const detached = await detachIncompleteQuoteIntent(
    booking.stripePaymentIntentId
  );
  if (!detached.ok) {
    return { ok: false, status: 409, message: detached.message };
  }

  updateData.status = "canceled";
  updateData.declinedAt = new Date();
  updateData.canceledAt = new Date();
  if (reason) {
    updateData.declineReason = reason;
  }

  return {
    ok: true,
    updateData,
    unsetFields: ["paymentTokenHash", "stripePaymentIntentId", "multisafepayOrderId"],
  };
}
