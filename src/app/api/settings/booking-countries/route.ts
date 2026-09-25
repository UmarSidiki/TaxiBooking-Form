import { NextResponse } from "next/server";
import { listPhoneCountries } from "@/features/geo/lib/country-dial-codes";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";

/**
 * Country codes for the booking-countries picker. Only codes are sent: the
 * client localises names with the built-in Intl.DisplayNames.
 */
export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    return NextResponse.json({
      success: true,
      data: { countries: listPhoneCountries() },
    });
  } catch (error) {
    console.error("GET /api/settings/booking-countries failed:", error);
    return jsonError("internal_error", 500);
  }
}
