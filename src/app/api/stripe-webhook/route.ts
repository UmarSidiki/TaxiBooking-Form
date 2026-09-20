import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/shared/db';
import { Booking, PendingBooking } from '@/features/booking/model';
import { Setting } from '@/features/settings/model';
import { finalizePaidBooking } from '@/features/payments/lib/finalize-paid-booking';
import { getStripeApiVersion } from '@/features/payments/lib/stripe-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { success: false, message: 'No signature found' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    await connectDB();

    const settings = await Setting.findOne();
    const stripeSecretKey = settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = settings?.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error('Stripe webhook is not fully configured');
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: getStripeApiVersion(),
    });

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errorMessage);
      return NextResponse.json(
        { success: false, message: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const result = await finalizePaidBooking({
          provider: 'stripe',
          paymentIntentId: paymentIntent.id,
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
        });

        if (!result.success) {
          console.error('Stripe finalize failed:', result.message);
          if (result.retryable) {
            return NextResponse.json(
              { success: false, message: result.message, retryable: true },
              { status: 500 }
            );
          }
        }
        break;
      }

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        break;
    }

    return NextResponse.json({ success: true, received: true });
  } catch (e: unknown) {
    console.error('Error processing Stripe webhook:', e);
    const message = e instanceof Error ? e.message : 'Webhook processing failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  if (orderId) {
    await PendingBooking.deleteOne({ orderId });
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const booking = await Booking.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!booking) return;

  const amountRefunded = charge.amount_refunded / 100;
  const totalAmount = booking.totalAmount || 0;

  await Booking.updateOne(
    { stripePaymentIntentId: paymentIntentId },
    {
      $set: {
        paymentStatus: charge.refunded ? 'refunded' : 'completed',
        refundAmount: amountRefunded,
        refundPercentage: totalAmount > 0 ? (amountRefunded / totalAmount) * 100 : 0,
      },
    }
  );
}
