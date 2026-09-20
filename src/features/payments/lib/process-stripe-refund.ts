import Stripe from 'stripe';
import type { IBooking } from '@/models/booking';

export async function processStripeRefund(
  booking: IBooking,
  refundPercentage: number,
  settings: { stripeSecretKey?: string } | null
): Promise<{ success: boolean; refundAmount?: number; error?: string }> {
  try {
    if (!booking.stripePaymentIntentId) {
      return { success: false, error: 'No payment intent ID found for refund' };
    }

    const stripeSecretKey =
      settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return {
        success: false,
        error: 'Stripe is not configured. Cannot process refund.',
      };
    }

    const stripeApiVersion = process.env
      .STRIPE_API_VERSION as Stripe.LatestApiVersion;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion });

    const paymentIntent = (await stripe.paymentIntents.retrieve(
      booking.stripePaymentIntentId,
      { expand: ['latest_charge'] }
    )) as Stripe.PaymentIntent;

    const baseAmount =
      typeof booking.totalAmount === 'number' ? booking.totalAmount : 0;
    const refundAmount = baseAmount * (refundPercentage / 100);
    const refundAmountCents = Math.round(refundAmount * 100);

    if (refundAmountCents <= 0) {
      return { success: false, error: 'Refund amount must be greater than zero' };
    }

    const latestCharge = paymentIntent.latest_charge;
    const chargeObject =
      latestCharge && typeof latestCharge !== 'string' ? latestCharge : undefined;
    const amountReceivedCents =
      paymentIntent.amount_received ??
      chargeObject?.amount ??
      paymentIntent.amount ??
      0;
    const amountAlreadyRefundedCents = chargeObject?.amount_refunded ?? 0;
    const refundableCents = Math.max(
      amountReceivedCents - amountAlreadyRefundedCents,
      0
    );

    if (refundableCents <= 0) {
      return {
        success: false,
        error: 'No refundable amount remains for this payment',
      };
    }

    const amountToRefundCents = Math.min(refundAmountCents, refundableCents);

    if (amountToRefundCents <= 0) {
      return { success: false, error: 'Calculated refund is zero' };
    }

    const refund = await stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      amount: amountToRefundCents,
      reason: 'requested_by_customer',
      metadata: {
        booking_id: booking._id?.toString() ?? '',
        trip_id: booking.tripId,
        refund_percentage: refundPercentage.toString(),
      },
    });

    if (refund.status === 'succeeded' || refund.status === 'pending') {
      return { success: true, refundAmount: amountToRefundCents / 100 };
    }

    return {
      success: false,
      error: `Refund failed with status: ${refund.status}`,
    };
  } catch (stripeError: unknown) {
    console.error('Stripe refund error:', stripeError);
    const errorMessage =
      stripeError instanceof Error ? stripeError.message : 'Unknown error';
    return { success: false, error: `Failed to process refund: ${errorMessage}` };
  }
}
