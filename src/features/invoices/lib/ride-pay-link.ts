import { createHmac, timingSafeEqual } from "node:crypto";
import { absoluteHttpBase, bookingMailLocale } from "@/features/booking/lib/booking-mail-url";

function secret() {
  return process.env.NEXTAUTH_SECRET || "";
}

export function signRidePayToken(tripId: string) {
  if (!secret() || !tripId) return null;
  const body = Buffer.from(tripId).toString("base64url");
  const sig = createHmac("sha256", secret()).update(`ride-pay:${body}`).digest("base64url");
  return `${body}.${sig}`;
}

export function readRidePayToken(token: string | null | undefined) {
  if (!token || !secret()) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(`ride-pay:${body}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const tripId = Buffer.from(body, "base64url").toString();
  return tripId || null;
}

export function ridePayUrl(baseUrl: string | null | undefined, locale: string | null | undefined, tripId: string) {
  const base = absoluteHttpBase(baseUrl);
  const token = signRidePayToken(tripId);
  if (!base || !token) return null;
  return `${base}/${bookingMailLocale(locale)}/pay/ride/${encodeURIComponent(token)}`;
}
