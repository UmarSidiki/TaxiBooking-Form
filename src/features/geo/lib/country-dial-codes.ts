import type { CountryCode } from "libphonenumber-js";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";

/**
 * Server-only: maps an ISO 3166-1 alpha-2 country code to its international
 * dialling code (e.g. "PK" -> "92"). Data comes from libphonenumber, so we
 * never hand-maintain a country table.
 */
export function getDialCode(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  try {
    return getCountryCallingCode(countryCode.toUpperCase() as CountryCode);
  } catch {
    return null;
  }
}

/** Every country that has an international dialling code, sorted. */
export function listPhoneCountries(): string[] {
  return getCountries().slice().sort();
}
