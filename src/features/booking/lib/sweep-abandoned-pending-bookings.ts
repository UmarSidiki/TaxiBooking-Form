import { PendingBooking } from "@/features/booking/model";
import { connectDB } from "@/shared/db";
import { getStripeClient } from "@/features/payments/lib/stripe-client";

const ABANDON_AFTER_MS = 24 * 60 * 60 * 1000;
const CANCELABLE_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);
const CANCEL_BATCH = 25;

/**
 * Marks checkout drafts that were never paid as abandoned. The TTL index is a
 * later safety net, so the status survives long enough for support to inspect.
 *
 * Abandoned drafts' PaymentIntents are cancelled here rather than from the
 * browser: an unload-time cancel cannot be ordered against the next page's
 * checkout session and would cancel the intent that page is about to reuse.
 */
export async function sweepAbandonedPendingBookings() {
  await connectDB();
  const cutoff = new Date(Date.now() - ABANDON_AFTER_MS);
  const stale = await PendingBooking.find({
    status: "open",
    createdAt: { $lt: cutoff },
    stripePaymentIntentId: { $exists: true, $ne: null },
  })
    .select("stripePaymentIntentId")
    .limit(CANCEL_BATCH)
    .lean();

  const result = await PendingBooking.updateMany(
    { status: "open", createdAt: { $lt: cutoff } },
    { $set: { status: "abandoned" } }
  );

  const stripe = stale.length > 0 ? await getStripeClient() : null;
  if (stripe) {
    await Promise.all(
      stale.map(async ({ stripePaymentIntentId }) => {
        if (!stripePaymentIntentId) return;
        try {
          const intent = await stripe.paymentIntents.retrieve(
            stripePaymentIntentId
          );
          if (CANCELABLE_STATUSES.has(intent.status)) {
            await stripe.paymentIntents.cancel(intent.id);
          }
        } catch (error) {
          console.warn("Could not cancel stale checkout PaymentIntent:", error);
        }
      })
    );
  }

  return { success: true, count: result.modifiedCount };
}
