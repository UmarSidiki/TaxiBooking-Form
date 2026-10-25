import { absoluteHttpBase, bookingMailLocale } from "@/features/booking/lib/booking-mail-url";

export function quotePayUrl(
  baseUrl: string | undefined,
  locale: string | null | undefined,
  token: string | undefined,
) {
  const base = absoluteHttpBase(baseUrl);
  if (!base || !token) return undefined;
  return `${base}/${bookingMailLocale(locale)}/pay/${encodeURIComponent(token)}`;
}
