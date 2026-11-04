let currency = "EUR";
let locale = "en";

/** Called by the account desk once public settings and the locale are known. */
export function setPortalMoneyFormat(next: { currency?: string | null; locale?: string | null }) {
  if (next.currency) currency = next.currency.toUpperCase();
  if (next.locale) locale = next.locale;
}

/** Server-render safe: callers pass the operator currency and active locale. */
export function formatMoney(
  amount: number | null | undefined,
  nextLocale: string,
  nextCurrency?: string | null,
): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  const code = (nextCurrency || "EUR").toUpperCase();
  try {
    return new Intl.NumberFormat(nextLocale, { style: "currency", currency: code }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function formatPortalMoney(amount?: number | null): string {
  return formatMoney(amount, locale, currency);
}
