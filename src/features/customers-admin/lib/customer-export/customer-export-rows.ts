import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import { connectDB } from "@/shared/db";
import {
  buildCustomerListFilter,
  customerListSortOrder,
  customerListSortSpec,
} from "@/features/customers-admin/lib/customer-list/customer-list-filter";
import { encodeCustomerListCursor } from "@/features/customers-admin/lib/customer-list/customer-list-cursor";
import { customerListSortValue } from "@/features/customers-admin/lib/customer-list/customer-list-sort-value";
import type { CustomerListDoc } from "@/features/customers-admin/lib/customer-list/customer-list.types";
import type { CustomerListParams } from "@/features/customers-admin/schema/customer-list.schema";

/** Hard cap for one export, so a stream can never run unbounded. */
export const CUSTOMER_EXPORT_MAX_ROWS = 50_000;

const EXPORT_PAGE_SIZE = 500;

const EXPORT_FIELDS = [
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

export type CustomerExportOptions = {
  limit?: number;
  now?: Date;
};

/**
 * Walks the same filtered, sorted read model as the list, key-set paged with
 * the list cursor until `limit` (50k by default). The deployment is
 * single-tenant: every CustomerStats row is this operator's data.
 */
export async function* iterateCustomerExportRows(
  params: CustomerListParams,
  options: CustomerExportOptions = {},
): AsyncGenerator<CustomerListDoc> {
  const limit = options.limit ?? CUSTOMER_EXPORT_MAX_ROWS;
  const now = options.now ?? new Date();
  const spec = customerListSortSpec(params.sort, params.dir);
  let cursor: string | null = null;
  let emitted = 0;

  await connectDB();

  while (emitted < limit) {
    const filter = buildCustomerListFilter(
      cursor ? { ...params, cursor } : params,
      now,
    );
    if (!filter) return;

    const pageSize = Math.min(EXPORT_PAGE_SIZE, limit - emitted);
    const docs = await CustomerStats.find(filter)
      .select(EXPORT_FIELDS)
      .sort(customerListSortOrder(spec))
      .limit(pageSize)
      .lean<CustomerListDoc[]>();

    for (const doc of docs) {
      if (emitted >= limit) return;
      emitted += 1;
      yield doc;
    }
    if (docs.length < pageSize) return;

    const last = docs[docs.length - 1];
    cursor = encodeCustomerListCursor(
      spec,
      customerListSortValue(last, spec.field),
      last.emailLower,
    );
  }
}
