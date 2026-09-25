import { resolveRequestCountry } from "@/features/geo/lib/resolve-request-country";
import { Setting } from "@/features/settings/model";
import { connectDB } from "@/shared/db";

export async function getAllowedBookingCountries(): Promise<string[]> {
  await connectDB();
  const settings = await Setting.findOne()
    .select("allowedBookingCountries")
    .lean();
  return (settings?.allowedBookingCountries ?? []).map((code) =>
    code.toUpperCase()
  );
}

/**
 * An empty allow-list means every country may book. An unknown country is
 * allowed too: this is a service-area policy, not a security control (a VPN
 * defeats it either way), so we fail open rather than lock out real customers.
 */
export function isBookingCountryBlocked(
  countryCode: string | null,
  allowed: string[]
): boolean {
  if (allowed.length === 0) return false;
  if (!countryCode) return false;
  return !allowed.includes(countryCode.toUpperCase());
}

export type CountryGateResult = { ok: true } | { ok: false; reason: "country_blocked" };

/**
 * Enforcement guard for public booking-creation endpoints. Skips the country
 * lookup entirely when no restriction is configured.
 */
export async function blockIfCountryNotAllowed(
  request: Request
): Promise<CountryGateResult> {
  const allowed = await getAllowedBookingCountries();
  if (allowed.length === 0) return { ok: true };

  const { countryCode } = await resolveRequestCountry(request);
  if (isBookingCountryBlocked(countryCode, allowed)) {
    return { ok: false, reason: "country_blocked" };
  }
  return { ok: true };
}
