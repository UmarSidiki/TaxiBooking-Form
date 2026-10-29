import { PendingBooking } from "@/features/booking/model";
import { connectDB } from "@/shared/db";
import { getStripeClient } from "@/features/payments/lib/stripe-client";

const CANCELABLE_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/**
 * Best-effort cancellation of the card PaymentIntent for a checkout draft.
 * Always marks the draft abandoned so retries cannot keep it open.
 */
export async function cancelCheckoutSession(draftId: string) {
  await connectDB();
  const pending = await PendingBooking.findOne({ draftId });
  if (!pending) {
    return { cancelled: false };
  }

  let cancelled = false;
  if (pending.stripePaymentIntentId) {
    const stripe = await getStripeClient();
    if (stripe) {
      try {
        const intent = await stripe.paymentIntents.retrieve(
          pending.stripePaymentIntentId
        );
        if (CANCELABLE_STATUSES.has(intent.status)) {
          await stripe.paymentIntents.cancel(intent.id);
          cancelled = true;
        }
      } catch (error) {
        console.warn("Could not cancel checkout PaymentIntent:", error);
      }
    }
  }

  pending.status = "abandoned";
  await pending.save();
  return { cancelled };
}
