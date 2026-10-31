import { absoluteHttpBase } from "@/features/booking/lib/booking-mail-url";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import {
  readRideStatusTokenPayload,
  signRideStatusToken,
} from "@/features/customers/lib/ride-status-token";

export async function rideStatusUrl(
  locale: string,
  tripId: string,
  baseUrl?: string | null,
): Promise<string> {
  const base = absoluteHttpBase(baseUrl ?? (await resolvePublicUrl()));
  const token = signRideStatusToken(`${locale}|${tripId}`, 60 * 60 * 24 * 14);
  if (!base || !token) return "";
  return `${base}/${locale}/ride-status?token=${encodeURIComponent(token)}`;
}

export function readRideStatusToken(token: string | null) {
  const raw = token ? readRideStatusTokenPayload(token) : null;
  if (!raw || !raw.includes("|")) return null;
  const [locale, tripId] = raw.split("|");
  return locale && tripId ? { locale, tripId } : null;
}
