import type { CustomerListDoc } from "@/features/customers-admin/lib/customer-list/customer-list.types";

/** Value of the sorted field for a row, used to build the next cursor. */
export function customerListSortValue(
  doc: CustomerListDoc,
  field: string,
): string | number | Date | null {
  if (field === "createdAt") return doc.createdAt;
  if (field === "lastRideAt") return doc.lastRideAt;
  if (field === "nameLower") return doc.nameLower ?? doc.name.toLowerCase();
  if (field === "emailLower") return doc.emailLower;
  if (field === "rideCount") return doc.rideCount;
  if (field === "totalSpendMinor") return doc.totalSpendMinor;
  return null;
}
