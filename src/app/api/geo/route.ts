import { NextResponse } from "next/server";
import {
  getAllowedBookingCountries,
  isBookingCountryBlocked,
} from "@/features/geo/lib/booking-country-policy";
import { getDialCode } from "@/features/geo/lib/country-dial-codes";
import { resolveRequestCountry } from "@/features/geo/lib/resolve-request-country";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";

/**
 * Resolves the visitor's country once per client session: the dial code feeds
 * the step-3 phone prefix, and bookingBlocked drives the wizard gate.
 */
export async function GET(request: Request) {
  try {
    const [allowed, { countryCode }] = await Promise.all([
      getAllowedBookingCountries(),
      resolveRequestCountry(request),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        countryCode,
        dialCode: getDialCode(countryCode),
        bookingBlocked: isBookingCountryBlocked(countryCode, allowed),
      },
    });
  } catch (error) {
    console.error("GET /api/geo failed:", error);
    return jsonError("internal_error", 500);
  }
}
