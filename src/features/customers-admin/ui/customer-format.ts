import type { CustomerListRow } from "@/features/customers-admin/lib/customer-list/customer-list.types";

export function customerDisplayName(row: CustomerListRow): string {
  const name = row.name.trim();
  return name || row.email.split("@")[0] || row.email;
}

export function formatCustomerMoney(
  minor: number,
  currency: string,
  locale: string,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    return `${currency || "EUR"} ${(minor / 100).toFixed(2)}`;
  }
}

/** Ride dates are operator wall-clock stored as UTC, so format them as UTC. */
export function formatCustomerRideDate(
  value: string | null,
  locale: string,
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export function formatCustomerCreatedAt(
  value: string,
  locale: string,
): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function formatCustomerPhone(row: CustomerListRow): string {
  const phone = (row.verifiedPhone || row.phoneDigits).trim();
  if (!phone) return "";
  return phone.startsWith("+") ? phone : `+${phone}`;
}
