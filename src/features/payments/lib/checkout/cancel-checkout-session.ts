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
 *
 * `paymentIntentId` scopes the cancel to the intent the page actually opened.
 * A late request from an old tab or a previous payment method must never cancel
 * the intent a newer session handed to Elements — that produces Stripe's
 * "PaymentIntent is in a terminal state" error.
 */
export async function cancelCheckoutSession(
  draftId: string,
  paymentIntentId?: string
) {
  await connectDB();
  const pending = await PendingBooking.findOne({ draftId });
  if (!pending) {
    return { cancelled: false };
  }

  const storedIntentId = pending.stripePaymentIntentId;
  if (paymentIntentId && storedIntentId && storedIntentId !== paymentIntentId) {
    return { cancelled: false };
  }

  let cancelled = false;
  let cancelFailed = false;
  if (storedIntentId) {
    const stripe = await getStripeClient();
    if (stripe) {
      try {
        const intent = await stripe.paymentIntents.retrieve(storedIntentId);
        if (CANCELABLE_STATUSES.has(intent.status)) {
          await stripe.paymentIntents.cancel(intent.id);
          cancelled = true;
        }
      } catch (error) {
        cancelFailed = true;
        console.warn("Could not cancel checkout PaymentIntent:", error);
      }
    }
  }

  // Leave the draft open when Stripe could not be reached: the intent is still
  // usable, and the next session (or the sweep) can handle it.
  if (!cancelFailed) {
    // Only abandon the draft while it still points at the intent we just looked
    // at; a concurrent session may have moved it to a newer one.
    await PendingBooking.updateOne(
      storedIntentId
        ? { draftId, stripePaymentIntentId: storedIntentId }
        : { draftId },
      { $set: { status: "abandoned" } }
    );
  }
  return { cancelled };
}
