import { absoluteHttpBase } from "@/features/booking/lib/booking-mail-url";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import {
  readCustomerToken,
  signCustomerToken,
} from "@/features/customers/lib/customer-token";

const RIDE_STATUS_PURPOSE = "ride_status";
const RIDE_STATUS_TTL_SECONDS = 60 * 60 * 24 * 14;

export async function rideStatusUrl(
  locale: string,
  tripId: string,
  baseUrl?: string | null,
): Promise<string> {
  const base = absoluteHttpBase(baseUrl ?? (await resolvePublicUrl()));
  const token = signCustomerToken(
    RIDE_STATUS_PURPOSE,
    { l: locale, t: tripId },
    RIDE_STATUS_TTL_SECONDS,
  );
  if (!base || !token) return "";
  return `${base}/${locale}/ride-status?token=${encodeURIComponent(token)}`;
}

export function readRideStatusToken(token: string | null) {
  const payload = readCustomerToken(token, RIDE_STATUS_PURPOSE);
  return payload ? { locale: payload.l, tripId: payload.t } : null;
}
