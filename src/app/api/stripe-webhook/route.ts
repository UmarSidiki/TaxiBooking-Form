import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/database';
import { Booking, PendingBooking } from '@/models/booking';
import { Setting } from '@/models/settings';
import { finalizePaidBooking } from '@/lib/payments/finalize-paid-booking';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function getRawBody(request: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();

  if (!reader) {
    throw new Error('No body in request');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  try {
    await connectDB();

    const settings = await Setting.findOne();
    const stripeSecretKey = settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = settings?.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey) {
      console.error('Stripe secret key not configured');
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    if (!stripeWebhookSecret) {
      console.error('Stripe webhook secret not configured');
      return NextResponse.json(
        { success: false, message: 'Stripe webhook secret is not configured' },
        { status: 500 }
      );
    }

    const stripeOptions: Stripe.StripeConfig = {};
    const stripeApiVersion = process.env.STRIPE_API_VERSION;
    if (stripeApiVersion) {
      stripeOptions.apiVersion = stripeApiVersion as Stripe.LatestApiVersion;
    }
    const stripe = new Stripe(stripeSecretKey, stripeOptions);

    const rawBody = await getRawBody(request);
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'No signature found' },
        { status: 400 }
      );
    }

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Webhook signature verification failed:', errorMessage);
      return NextResponse.json(
        { success: false, message: `Webhook signature verification failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    console.log('✅ Stripe webhook received:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const result = await finalizePaidBooking({
          provider: 'stripe',
          paymentIntentId: paymentIntent.id,
          baseUrl,
        });

        if (!result.success) {
          console.error('Stripe finalize failed:', result.message);
          // Only retry webhook when pending booking may appear later (cold start)
          if (result.retryable) {
            return NextResponse.json(
              { success: false, message: result.message, retryable: true },
              { status: 500 }
            );
          }
        }

        console.log('✅ Stripe booking finalized:', result.tripId);
        break;
      }

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
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
  console.log('❌ Payment failed:', { paymentIntentId: paymentIntent.id, orderId });

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

  if (booking) {
    const amountRefunded = charge.amount_refunded / 100;
    const totalAmount = booking.totalAmount || 0;
    const refundPercentage = totalAmount > 0 ? (amountRefunded / totalAmount) * 100 : 0;

    await Booking.updateOne(
      { stripePaymentIntentId: paymentIntentId },
      {
        $set: {
          paymentStatus: charge.refunded ? 'refunded' : 'completed',
          refundAmount: amountRefunded,
          refundPercentage,
        },
      }
    );
  }
}
