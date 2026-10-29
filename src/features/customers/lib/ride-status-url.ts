import { absoluteHttpBase } from "@/features/booking/lib/booking-mail-url";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { readCustomerToken, signCustomerToken } from "@/features/customers/lib/customer-token";

export async function rideStatusUrl(
  locale: string,
  tripId: string,
  baseUrl?: string | null,
): Promise<string> {
  const base = absoluteHttpBase(baseUrl ?? (await resolvePublicUrl()));
  const token = signCustomerToken(`${locale}|${tripId}`, 60 * 60 * 24 * 14);
  if (!base || !token) return "";
  return `${base}/${locale}/ride-status?token=${encodeURIComponent(token)}`;
}

export function readRideStatusToken(token: string | null) {
  const raw = token ? readCustomerToken(token) : null;
  if (!raw || !raw.includes("|")) return null;
  const [locale, tripId] = raw.split("|");
  return locale && tripId ? { locale, tripId } : null;
}
