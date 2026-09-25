import Stripe from "stripe";
import { getStripeClient } from "@/features/payments/lib/stripe-client";

const CANCELABLE_STATUSES: Stripe.PaymentIntent.Status[] = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "requires_capture",
];

export type QuotePaymentIntentResult =
  | { ok: true }
  | { ok: false; message: string };

function isFullyRefunded(charge: Stripe.Charge | string | null): boolean {
  if (typeof charge === "string" || !charge) return false;
  return (
    Boolean(charge.refunded) ||
    (typeof charge.amount_refunded === "number" &&
      charge.amount_refunded >= charge.amount)
  );
}

function isPaymentIntentCollectable(
  paymentIntent: Stripe.PaymentIntent
): boolean {
  if (
    paymentIntent.status !== "succeeded" &&
    paymentIntent.status !== "processing"
  ) {
    return false;
  }
  return !isFullyRefunded(paymentIntent.latest_charge);
}

export async function detachIncompleteQuoteIntent(
  paymentIntentId?: string | null
): Promise<QuotePaymentIntentResult> {
  if (!paymentIntentId) return { ok: true };

  const stripe = await getStripeClient();
  if (!stripe) return { ok: true };

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    if (isPaymentIntentCollectable(paymentIntent)) {
      return {
        ok: false,
        message:
          "A card payment is already in progress or completed for this request",
      };
    }

    if (CANCELABLE_STATUSES.includes(paymentIntent.status)) {
      await stripe.paymentIntents.cancel(paymentIntentId);
    }

    return { ok: true };
  } catch (error) {
    if (
      error instanceof Stripe.errors.StripeError &&
      error.code === "resource_missing"
    ) {
      return { ok: true };
    }
    console.error(
      "Could not detach quote PaymentIntent:",
      paymentIntentId,
      error
    );
    return { ok: true };
  }
}

export async function refundQuotePaymentIntent(
  paymentIntentId: string
): Promise<QuotePaymentIntentResult> {
  const stripe = await getStripeClient();
  if (!stripe) {
    return { ok: false, message: "Stripe is not configured" };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    if (paymentIntent.status === "requires_capture") {
      await stripe.paymentIntents.cancel(paymentIntentId);
      return { ok: true };
    }

    if (paymentIntent.status !== "succeeded") {
      return { ok: true };
    }

    if (isFullyRefunded(paymentIntent.latest_charge)) {
      return { ok: true };
    }

    await stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { idempotencyKey: `quote_refund_${paymentIntentId}` }
    );
    return { ok: true };
  } catch (error) {
    if (
      error instanceof Stripe.errors.StripeError &&
      error.code === "charge_already_refunded"
    ) {
      return { ok: true };
    }
    console.error(
      "Could not refund quote PaymentIntent:",
      paymentIntentId,
      error
    );
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Refund failed",
    };
  }
}
