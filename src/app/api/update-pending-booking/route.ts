import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import { PendingBooking } from '@/models/booking';

const CONTACT_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'notes',
  'flightNumber',
] as const;

export async function POST(request: NextRequest) {
  try {
    const { orderId, bookingData } = await request.json();

    if (!orderId || !bookingData) {
      return NextResponse.json(
        { success: false, message: 'Order ID and booking data are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await PendingBooking.findOne({ orderId });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Pending booking not found' },
        { status: 404 }
      );
    }

    const nextBookingData = { ...existing.bookingData };
    for (const field of CONTACT_FIELDS) {
      if (bookingData[field] !== undefined) {
        nextBookingData[field] = bookingData[field];
      }
    }

    existing.bookingData = nextBookingData;
    existing.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await existing.save();

    return NextResponse.json({
      success: true,
      message: 'Pending booking updated',
      orderId: existing.orderId,
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
