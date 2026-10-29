let currency = "EUR";
let locale = "en";

/** Called by the account desk once public settings and the locale are known. */
export function setPortalMoneyFormat(next: { currency?: string | null; locale?: string | null }) {
  if (next.currency) currency = next.currency.toUpperCase();
  if (next.locale) locale = next.locale;
}

export function formatPortalMoney(amount?: number | null): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
