import { NextRequest, NextResponse } from "next/server";
import { createCashBooking } from "@/features/booking/lib/create-cash-booking.service";
import { resolveBookingRequestBaseUrl } from "@/features/booking/lib/resolve-booking-request-base-url";
import { parseCashBookingInput } from "@/features/booking/schema/cash-booking.schema";
import { jsonError, jsonErrorFromStatus } from "@/shared/http/json-error";

export async function POST(request: NextRequest) {
  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return jsonError("invalid_body", 400);
    }

    const parsed = parseCashBookingInput(raw);
    if (!parsed.success) {
      return jsonError(parsed.error, 400);
    }

    const result = await createCashBooking(
      parsed.data,
      request.nextUrl.origin,
      resolveBookingRequestBaseUrl(request)
    );

    if (!result.ok) {
      return jsonErrorFromStatus(result.status);
    }

    return NextResponse.json(
      {
        success: true,
        tripId: result.tripId,
        totalAmount: result.totalAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Booking create failed:", error);
    return jsonError("internal_error", 500);
  }
}
