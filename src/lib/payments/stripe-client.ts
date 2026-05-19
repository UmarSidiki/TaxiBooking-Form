import Stripe from 'stripe';
import { connectDB } from '@/lib/database';
import { Setting } from '@/models/settings';

export async function getStripeClient(): Promise<Stripe | null> {
  await connectDB();
  const settings = await Setting.findOne();
  const stripeSecretKey = settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return null;
  }

  const stripeOptions: Stripe.StripeConfig = {};
  const stripeApiVersion = process.env.STRIPE_API_VERSION;
  if (stripeApiVersion) {
    stripeOptions.apiVersion = stripeApiVersion as Stripe.LatestApiVersion;
  }

  return new Stripe(stripeSecretKey, stripeOptions);
}

export function getPaidAmountFromPaymentIntent(paymentIntent: Stripe.PaymentIntent): number {
  const cents = paymentIntent.amount_received ?? paymentIntent.amount;
  return cents / 100;
}
