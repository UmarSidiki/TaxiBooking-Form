import type { QueryFilter } from "mongoose";
import type { ICustomerStats } from "@/features/customers-admin/model/CustomerStats";
import type { CustomerListSortSpec } from "@/features/customers-admin/lib/customer-list/customer-list.types";
import {
  decodeCustomerListCursor,
  type CustomerListCursor,
} from "@/features/customers-admin/lib/customer-list/customer-list-cursor";
import type {
  CustomerListParams,
  CustomerSort,
  CustomerSortDirection,
} from "@/features/customers-admin/schema/customer-list.schema";

const SORT_FIELDS: Record<
  CustomerSort,
  { field: string; kind: CustomerListSortSpec["kind"] }
> = {
  name: { field: "nameLower", kind: "string" },
  email: { field: "emailLower", kind: "string" },
  rides: { field: "rideCount", kind: "number" },
  spend: { field: "totalSpendMinor", kind: "number" },
  "last-ride": { field: "lastRideAt", kind: "date-null" },
  created: { field: "createdAt", kind: "date" },
};

export function customerListSortSpec(
  sort: CustomerSort,
  direction: CustomerSortDirection,
): CustomerListSortSpec {
  return { sort, direction, ...SORT_FIELDS[sort] };
}

export function customerListSortOrder(
  spec: CustomerListSortSpec,
): Record<string, 1 | -1> {
  const direction = spec.direction === "asc" ? 1 : -1;
  if (spec.field === "emailLower") return { emailLower: direction };
  return { [spec.field]: direction, emailLower: 1 };
}

/** Index-friendly prefix range. Never builds a pattern, so no collection scan. */
function prefixRange(prefix: string) {
  return { $gte: prefix, $lt: `${prefix}\uffff` };
}

function phoneDigits(value: string): string {
  let digits = "";
  for (const char of value) {
    if (char >= "0" && char <= "9") digits += char;
  }
  return digits;
}

function searchCondition(query: string): QueryFilter<ICustomerStats> {
  const lower = query.toLowerCase();
  const conditions: QueryFilter<ICustomerStats>[] = [
    { emailLower: prefixRange(lower) },
    { nameLower: prefixRange(lower) },
  ];
  const digits = phoneDigits(query);
  if (digits) conditions.push({ phoneDigits: prefixRange(digits) });
  return { $or: conditions };
}

function consentCondition(
  field: "emailConsent" | "whatsappConsent",
  value: "any" | "granted" | "none",
): QueryFilter<ICustomerStats> | null {
  if (value === "granted") return { [field]: "granted" };
  if (value === "none") return { [field]: { $ne: "granted" } };
  return null;
}

function baseConditions(
  params: CustomerListParams,
  now: Date,
): QueryFilter<ICustomerStats>[] {
  const conditions: QueryFilter<ICustomerStats>[] = [];
  const query = params.q.trim();
  if (query) conditions.push(searchCondition(query));
  if (params.ridesMin !== undefined) {
    conditions.push({ rideCount: { $gte: params.ridesMin } });
  }
  if (params.ridesMax !== undefined) {
    conditions.push({ rideCount: { $lte: params.ridesMax } });
  }
  if (params.spendMin !== undefined) {
    conditions.push({ totalSpendMinor: { $gte: Math.round(params.spendMin * 100) } });
  }
  if (params.spendMax !== undefined) {
    conditions.push({ totalSpendMinor: { $lte: Math.round(params.spendMax * 100) } });
  }
  if (params.lastRide === "never") {
    conditions.push({ lastRideAt: null });
  } else if (params.lastRide === "within" || params.lastRide === "before") {
    const cutoff = new Date(now.getTime() - params.lastRideDays * 86_400_000);
    conditions.push({
      lastRideAt: params.lastRide === "within" ? { $gte: cutoff } : { $lt: cutoff },
    });
  }
  if (params.verifiedWhatsApp === "yes") {
    conditions.push({ verifiedPhone: { $ne: "" } });
  } else if (params.verifiedWhatsApp === "no") {
    conditions.push({ verifiedPhone: { $in: ["", null] } });
  }
  const emailConsent = consentCondition("emailConsent", params.emailConsent);
  if (emailConsent) conditions.push(emailConsent);
  const whatsappConsent = consentCondition(
    "whatsappConsent",
    params.whatsappConsent,
  );
  if (whatsappConsent) conditions.push(whatsappConsent);
  if (params.locale !== "any") conditions.push({ locale: params.locale });
  if (params.upcoming === "yes") conditions.push({ hasUpcoming: true });
  if (params.upcoming === "no") conditions.push({ hasUpcoming: false });
  return conditions;
}

function cursorCondition(
  spec: CustomerListSortSpec,
  cursor: CustomerListCursor,
): QueryFilter<ICustomerStats> {
  const key = spec.field;
  const email = cursor.emailLower;
  if (cursor.value === null) {
    if (spec.direction === "desc") {
      return { [key]: null, emailLower: { $gt: email } };
    }
    return {
      $or: [
        { [key]: null, emailLower: { $gt: email } },
        { [key]: { $ne: null } },
      ],
    };
  }
  const operator = spec.direction === "desc" ? "$lt" : "$gt";
  if (spec.field === "emailLower") {
    return { emailLower: { [operator]: cursor.value } };
  }
  const conditions: QueryFilter<ICustomerStats>[] = [
    { [key]: { [operator]: cursor.value } },
    { [key]: cursor.value, emailLower: { $gt: email } },
  ];
  if (spec.kind === "date-null" && spec.direction === "desc") {
    conditions.push({ [key]: null });
  }
  return { $or: conditions };
}

/** Null means the cursor could not be trusted for this sort. */
export function buildCustomerListFilter(
  params: CustomerListParams,
  now: Date,
): QueryFilter<ICustomerStats> | null {
  const spec = customerListSortSpec(params.sort, params.dir);
  const conditions = baseConditions(params, now);
  if (params.cursor) {
    const cursor = decodeCustomerListCursor(
      params.cursor,
      spec,
      params.sort,
      params.dir,
    );
    if (!cursor) return null;
    conditions.push(cursorCondition(spec, cursor));
  }
  return conditions.length > 0 ? { $and: conditions } : {};
}
