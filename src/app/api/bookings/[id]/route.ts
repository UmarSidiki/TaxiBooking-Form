import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/db';
import { bookingPatchSuccessMessage } from '@/features/booking/lib/booking-patch-message';
import {
  deleteBookingById,
  findBookingById,
} from '@/features/booking/lib/booking.repo';
import { patchBooking } from '@/features/booking/lib/patch-booking.service';
import { resolveBookingRequestBaseUrl } from '@/features/booking/lib/resolve-booking-request-base-url';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const booking = await findBookingById(id);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch booking',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await patchBooking(
      id,
      body,
      resolveBookingRequestBaseUrl(request)
    );

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: bookingPatchSuccessMessage(result.action),
      data: result.booking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update booking',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const deletedBooking = await deleteBookingById(id);

    if (!deletedBooking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete booking',
      },
      { status: 500 }
    );
  }
}
