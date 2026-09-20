import Stripe from 'stripe';
import { connectDB } from '@/shared/db';
import { Setting } from '@/features/settings/model';

const DEFAULT_API_VERSION = '2026-07-29.dahlia' as Stripe.LatestApiVersion;

export function getStripeApiVersion(): Stripe.LatestApiVersion {
  return (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) || DEFAULT_API_VERSION;
}

export async function getStripeClient(): Promise<Stripe | null> {
  await connectDB();
  const settings = await Setting.findOne();
  const stripeSecretKey = settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return null;
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: getStripeApiVersion(),
  });
}

export function getPaidAmountFromPaymentIntent(paymentIntent: Stripe.PaymentIntent): number {
  const cents = paymentIntent.amount_received ?? paymentIntent.amount;
  return cents / 100;
}
