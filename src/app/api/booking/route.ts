import { NextRequest, NextResponse } from 'next/server';
import { createCashBooking } from '@/lib/bookings/create-cash-booking.service';
import { resolveBookingRequestBaseUrl } from '@/lib/bookings/resolve-booking-request-base-url';
import { parseCashBookingInput } from '@/lib/schemas/cash-booking.schema';

export async function POST(request: NextRequest) {
  try {
    const parsed = parseCashBookingInput(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.message },
        { status: 400 }
      );
    }

    const result = await createCashBooking(
      parsed.data,
      request.nextUrl.origin,
      resolveBookingRequestBaseUrl(request)
    );

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        tripId: result.tripId,
        totalAmount: result.totalAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Booking failed',
      },
      { status: 500 }
    );
  }
}
