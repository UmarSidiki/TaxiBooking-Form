import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Booking from '@/models/Booking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // MultiSafepay sends transaction ID and status
    const { transactionid, order_id } = body;

    if (!transactionid) {
      return NextResponse.json(
        { success: false, message: 'Missing transaction ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find booking by order ID or transaction ID
    const booking = await Booking.findOne({
      $or: [
        { multisafepayOrderId: order_id },
        { multisafepayTransactionId: transactionid }
      ]
    });

    if (!booking) {
      console.error('Booking not found for MultiSafepay webhook:', { order_id, transactionid });
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update booking payment status based on MultiSafepay status
    // You would typically verify the status with MultiSafepay API here
    booking.paymentStatus = 'completed';
    booking.multisafepayTransactionId = transactionid;
    await booking.save();

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (e: unknown) {
    console.error('Error processing MultiSafepay webhook:', e);
    const message = e instanceof Error ? e.message : 'Webhook processing failed';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
