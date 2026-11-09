import { loadPaymentSettings } from '@/features/payments/lib/load-payment-settings';
import {
  getPaidAmountFromPaymentIntent,
  getStripeClient,
} from '@/features/payments/lib/stripe-client';
import type {
  UnverifiedPayment,
  VerifiedPayment,
} from '@/features/payments/lib/finalize-paid-booking.types';

const DEFAULT_CURRENCY = 'EUR';

export async function verifyStripePayment(
  paymentIntentId: string
): Promise<VerifiedPayment | UnverifiedPayment> {
  const { settings } = await loadPaymentSettings();
  const stripe = await getStripeClient();

  if (!stripe) {
    return { ok: false, message: 'Stripe is not configured' };
  }

  const paymentIntent = await stripe.paymentIntents
    .retrieve(paymentIntentId)
    .catch((error: { code?: string }) => {
      // Unknown/foreign ids must read as a failed check, not a 500.
      if (error?.code === 'resource_missing') return null
      throw error
    })

  if (!paymentIntent) {
    return { ok: false, message: 'Payment intent not found' }
  }

  if (paymentIntent.status !== 'succeeded') {
    return {
      ok: false,
      message: `Payment not completed (status: ${paymentIntent.status})`,
      retryable:
        paymentIntent.status === 'processing' ||
        paymentIntent.status === 'requires_capture',
    };
  }

  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) {
    return { ok: false, message: 'Missing order_id in payment metadata' };
  }

  return {
    ok: true,
    orderId,
    draftId: paymentIntent.metadata?.draft_id,
    paidAmount: getPaidAmountFromPaymentIntent(paymentIntent),
    currency:
      paymentIntent.currency?.toUpperCase() ||
      settings?.stripeCurrency?.toUpperCase() ||
      DEFAULT_CURRENCY,
  };
}
