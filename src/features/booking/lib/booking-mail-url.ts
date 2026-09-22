const BOOKING_MAIL_LOCALES = ["en", "fr", "es", "de", "nl", "it", "ru", "ar"] as const;

export function bookingMailLocale(value?: string | null) {
  return BOOKING_MAIL_LOCALES.includes(value as (typeof BOOKING_MAIL_LOCALES)[number])
    ? (value as (typeof BOOKING_MAIL_LOCALES)[number])
    : "en";
}

export function absoluteHttpBase(value?: string | null) {
  const raw = (value || process.env.NEXT_PUBLIC_BASE_URL || "").trim().replace(/\/$/, "");
  return /^https?:\/\//i.test(raw) ? raw : null;
}

export function invoiceDownloadUrl(baseUrl: string | undefined, tripId: string) {
  const base = absoluteHttpBase(baseUrl);
  if (!base) return null;
  return `${base}/api/invoice/${encodeURIComponent(tripId)}`;
}

export function deskRideUrl(
  baseUrl: string | undefined,
  locale: string | undefined,
  bookingId?: string
) {
  const base = absoluteHttpBase(baseUrl);
  if (!base || !bookingId) return null;
  return `${base}/${bookingMailLocale(locale)}/dashboard/rides?bookingId=${encodeURIComponent(bookingId)}`;
}
