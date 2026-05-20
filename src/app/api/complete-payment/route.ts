import { NextRequest, NextResponse } from 'next/server';
import { finalizePaidBooking } from '@/lib/payments/finalize-paid-booking';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, paymentIntentId, transactionId, orderId } = body;

    if (provider !== 'stripe' && provider !== 'multisafepay') {
      return NextResponse.json(
        { success: false, message: 'Invalid payment provider' },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.headers.get('origin') ||
      undefined;

    const result = await finalizePaidBooking({
      provider,
      paymentIntentId,
      transactionId,
      orderId,
      baseUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          retryable: result.retryable ?? false,
        },
        { status: result.retryable ? 202 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tripId: result.tripId,
      bookingId: result.bookingId,
      alreadyExisted: result.alreadyExisted,
      emails: result.emails,
    });
  } catch (error) {
    console.error('complete-payment error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Payment completion failed',
        retryable: true,
      },
      { status: 500 }
    );
  }
}
