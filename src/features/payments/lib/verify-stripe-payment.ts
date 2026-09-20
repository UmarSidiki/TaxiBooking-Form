import { loadPaymentSettings } from '@/lib/payments/load-payment-settings';
import {
  getPaidAmountFromPaymentIntent,
  getStripeClient,
} from '@/lib/payments/stripe-client';
import type {
  UnverifiedPayment,
  VerifiedPayment,
} from '@/lib/payments/finalize-paid-booking.types';

const DEFAULT_CURRENCY = 'EUR';

export async function verifyStripePayment(
  paymentIntentId: string
): Promise<VerifiedPayment | UnverifiedPayment> {
  const { settings } = await loadPaymentSettings();
  const stripe = await getStripeClient();

  if (!stripe) {
    return { ok: false, message: 'Stripe is not configured' };
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

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
    paidAmount: getPaidAmountFromPaymentIntent(paymentIntent),
    currency:
      paymentIntent.currency?.toUpperCase() ||
      settings?.stripeCurrency?.toUpperCase() ||
      DEFAULT_CURRENCY,
  };
}
