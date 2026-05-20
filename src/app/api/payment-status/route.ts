import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import { Booking } from '@/models/booking';

export const dynamic = 'force-dynamic';

/**
 * Lightweight check — avoids running full payment finalization when already done.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tripId = searchParams.get('tripId');
    const paymentIntentId = searchParams.get('paymentIntentId');
    const transactionId = searchParams.get('transactionId');

    if (!tripId && !paymentIntentId && !transactionId) {
      return NextResponse.json(
        { success: false, message: 'Missing identifier' },
        { status: 400 }
      );
    }

    await connectDB();

    const orConditions: Record<string, string>[] = [];
    if (tripId) {
      orConditions.push({ tripId }, { multisafepayOrderId: tripId });
    }
    if (paymentIntentId) {
      orConditions.push({ stripePaymentIntentId: paymentIntentId });
    }
    if (transactionId) {
      orConditions.push({ multisafepayTransactionId: transactionId });
    }

    const booking = await Booking.findOne({
      $or: orConditions,
      paymentStatus: 'completed',
    })
      .select('tripId confirmationEmailSent adminNotificationSent')
      .lean();

    if (!booking) {
      return NextResponse.json({
        success: true,
        finalized: false,
      });
    }

    return NextResponse.json({
      success: true,
      finalized: true,
      tripId: booking.tripId,
      emailsComplete: Boolean(
        booking.confirmationEmailSent && booking.adminNotificationSent
      ),
    });
  } catch (error) {
    console.error('payment-status error:', error);
    return NextResponse.json(
      { success: false, finalized: false },
      { status: 500 }
    );
  }
}
