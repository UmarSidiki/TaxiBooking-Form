import { NextRequest, NextResponse } from "next/server";
import { createAppointmentRequest } from "@/features/booking/lib/create-appointment-request.service";
import { createCashBooking } from "@/features/booking/lib/create-cash-booking.service";
import { isAppointmentRequestEnabled } from "@/features/booking/lib/is-appointment-request-enabled";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { parseCashBookingInput } from "@/features/booking/schema/cash-booking.schema";
import { blockIfCountryNotAllowed } from "@/features/geo/lib/booking-country-policy";
import { jsonError, jsonErrorFromStatus } from "@/shared/http/json-error";
import { limitSensitive } from "@/shared/http/sensitive-limit";

export async function POST(request: NextRequest) {
  const limited = await limitSensitive(request, "booking");
  if (limited) return limited;
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

    const country = await blockIfCountryNotAllowed(request);
    if (!country.ok) {
      return jsonError("country_blocked", 403);
    }

    const baseUrl = (await resolvePublicUrl({ request })) ?? undefined;
    const appointFirst = await isAppointmentRequestEnabled();

    const result = appointFirst
      ? await createAppointmentRequest(parsed.data, baseUrl)
      : await createCashBooking(parsed.data, baseUrl);

    if (!result.ok) {
      return jsonErrorFromStatus(result.status);
    }

    return NextResponse.json(
      {
        success: true,
        tripId: result.tripId,
        totalAmount: result.totalAmount,
        mode: appointFirst ? "request" : "instant",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Booking create failed:", error);
    return jsonError("internal_error", 500);
  }
}
