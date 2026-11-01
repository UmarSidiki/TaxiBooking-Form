import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import { connectDB } from "@/shared/db";
import {
  buildCustomerListFilter,
  customerListSortOrder,
  customerListSortSpec,
} from "@/features/customers-admin/lib/customer-list/customer-list-filter";
import { encodeCustomerListCursor } from "@/features/customers-admin/lib/customer-list/customer-list-cursor";
import type {
  CustomerListDoc,
  CustomerListResult,
  CustomerListRow,
} from "@/features/customers-admin/lib/customer-list/customer-list.types";
import type { CustomerListParams } from "@/features/customers-admin/schema/customer-list.schema";

export const CUSTOMER_LIST_PAGE_SIZE = 50;

const LIST_FIELDS = [
  "emailLower",
  "nameLower",
  "name",
  "phoneDigits",
  "verifiedPhone",
  "rideCount",
  "completedCount",
  "totalSpendMinor",
  "currency",
  "firstRideAt",
  "lastRideAt",
  "hasUpcoming",
  "locale",
  "emailConsent",
  "whatsappConsent",
  "createdAt",
].join(" ");

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toRow(doc: CustomerListDoc): CustomerListRow {
  return {
    id: doc.emailLower,
    email: doc.emailLower,
    name: doc.name,
    phoneDigits: doc.phoneDigits ?? "",
    verifiedPhone: doc.verifiedPhone ?? "",
    rides: doc.rideCount ?? 0,
    completedRides: doc.completedCount ?? 0,
    spendMinor: doc.totalSpendMinor ?? 0,
    currency: doc.currency || "EUR",
    firstRideAt: iso(doc.firstRideAt),
    lastRideAt: iso(doc.lastRideAt),
    hasUpcoming: Boolean(doc.hasUpcoming),
    locale: doc.locale || "en",
    emailConsent: doc.emailConsent ?? "none",
    whatsappConsent: doc.whatsappConsent ?? "none",
    createdAt: iso(doc.createdAt) ?? new Date(0).toISOString(),
  };
}

/**
 * One cursor page over CustomerStats. Fetches one extra row to report `hasMore`
 * without a count query, and never uses skip or pattern matching.
 */
export async function listCustomers(
  params: CustomerListParams,
  now = new Date(),
): Promise<CustomerListResult> {
  const filter = buildCustomerListFilter(params, now);
  if (!filter) return { ok: false, error: "invalid_cursor" };

  await connectDB();
  const spec = customerListSortSpec(params.sort, params.dir);
  const docs = await CustomerStats.find(filter)
    .select(LIST_FIELDS)
    .sort(customerListSortOrder(spec))
    .limit(CUSTOMER_LIST_PAGE_SIZE + 1)
    .lean<CustomerListDoc[]>();

  const hasMore = docs.length > CUSTOMER_LIST_PAGE_SIZE;
  const page = hasMore ? docs.slice(0, CUSTOMER_LIST_PAGE_SIZE) : docs;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCustomerListCursor(
          spec,
          sortValue(last, spec.field),
          last.emailLower,
        )
      : null;

  return { ok: true, rows: page.map(toRow), nextCursor };
}

function sortValue(
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
