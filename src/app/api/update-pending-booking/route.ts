import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import { PendingBooking } from '@/models/booking';

export async function POST(request: NextRequest) {
  try {
    const { orderId, bookingData } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!bookingData) {
      return NextResponse.json(
        { success: false, message: 'Booking data is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update existing pending booking or create new one
    const result = await PendingBooking.findOneAndUpdate(
      { orderId },
      {
        $set: {
          bookingData: bookingData,
          paymentMethod: 'stripe',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Refresh expiry
        },
      },
      { upsert: true, new: true }
    );

    console.log('📝 Pending booking updated for order:', orderId);

    return NextResponse.json({
      success: true,
      message: 'Pending booking updated',
      orderId: result.orderId,
    });
  } catch (e: unknown) {
    console.error('Error updating pending booking:', e);
    const message = e instanceof Error ? e.message : 'Failed to update pending booking';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
