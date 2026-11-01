import { csvLine } from "@/features/customers-admin/lib/customer-export/csv-cell";
import type { CustomerListDoc } from "@/features/customers-admin/lib/customer-list/customer-list.types";

/** List columns plus the cached marketing consent, as required by C5. */
export const CUSTOMER_EXPORT_HEADER = [
  "name",
  "email",
  "phone",
  "phone_verified",
  "rides",
  "completed_rides",
  "total_spend",
  "currency",
  "first_ride",
  "last_ride",
  "has_upcoming",
  "locale",
  "email_consent",
  "whatsapp_consent",
  "created_at",
];

export function customerExportHeaderLine(): string {
  return `${CUSTOMER_EXPORT_HEADER.join(",")}\r\n`;
}

function iso(value: Date | null | undefined): string {
  return value ? value.toISOString() : "";
}

function flags(value: boolean | null | undefined): string {
  return value ? "yes" : "no";
}

/** Minor units to major units, two decimals, no thousands separator. */
function money(minor: number | null | undefined): string {
  return ((minor ?? 0) / 100).toFixed(2);
}

export function customerExportLine(doc: CustomerListDoc): string {
  return csvLine([
    doc.name,
    doc.emailLower,
    doc.phoneDigits,
    flags(Boolean(doc.verifiedPhone)),
    doc.rideCount ?? 0,
    doc.completedCount ?? 0,
    money(doc.totalSpendMinor),
    doc.currency || "EUR",
    iso(doc.firstRideAt),
    iso(doc.lastRideAt),
    flags(doc.hasUpcoming),
    doc.locale || "en",
    doc.emailConsent ?? "none",
    doc.whatsappConsent ?? "none",
    iso(doc.createdAt),
  ]);
}
