import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Booking from '@/models/Booking';

export async function POST(request: NextRequest) {
  try {
    const { transactionId, orderId } = await request.json();

    if (!transactionId && !orderId) {
      return NextResponse.json(
        { success: false, message: 'Missing transaction ID or order ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find booking by transaction ID or order ID
    const booking = await Booking.findOne({
      $or: [
        { multisafepayTransactionId: transactionId },
        { multisafepayOrderId: orderId },
        { tripId: orderId }
      ]
    });

    if (!booking) {
      console.log('Booking not found for cancelled payment:', { transactionId, orderId });
      return NextResponse.json({ 
        success: true, 
        message: 'No booking found to cancel' 
      });
    }

    // Only cancel if payment is still pending
    if (booking.paymentStatus === 'pending') {
      booking.status = 'canceled';
      booking.paymentStatus = 'failed';
      booking.canceledAt = new Date();
      await booking.save();

      console.log('Booking cancelled:', booking.tripId);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Booking cancelled successfully' 
    });
  } catch (e: unknown) {
    console.error('Error cancelling booking:', e);
    const message = e instanceof Error ? e.message : 'Failed to cancel booking';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
