import type Stripe from "stripe";

/** A key that can never replay a previous intent. */
export function freshIdempotencyKey(idempotencyKey: string) {
  return `${idempotencyKey}_${Date.now()}`;
}

function isIdempotencyError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const { type, rawType } = error as { type?: string; rawType?: string };
  return type === "StripeIdempotencyError" || rawType === "idempotency_error";
}

/**
 * Creates the checkout PaymentIntent under the draft's idempotency key.
 *
 * Stripe replays the first response for a key and refuses the request outright
 * when the parameters changed (the customer can edit name/email between
 * checkout opens). A fresh key is safe there: the key only dedupes concurrent
 * creates, and the pending row is the source of truth for the live intent.
 */
export async function createCheckoutIntent(
  stripe: Stripe,
  params: Stripe.PaymentIntentCreateParams,
  idempotencyKey: string
): Promise<Stripe.PaymentIntent> {
  try {
    return await stripe.paymentIntents.create(params, { idempotencyKey });
  } catch (error) {
    if (!isIdempotencyError(error)) throw error;
    return stripe.paymentIntents.create(params, {
      idempotencyKey: freshIdempotencyKey(idempotencyKey),
    });
  }
}
