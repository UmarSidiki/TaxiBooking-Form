import type {
  CustomerSort,
  CustomerSortDirection,
} from "@/features/customers-admin/schema/customer-list.schema";

export type CustomerConsentValue = "none" | "granted" | "withdrawn";

export type CustomerListSortSpec = {
  sort: CustomerSort;
  direction: CustomerSortDirection;
  field: string;
  kind: "string" | "number" | "date" | "date-null";
};

/** Fields the list API returns. Dates are ISO strings in the JSON payload. */
export type CustomerListRow = {
  id: string;
  email: string;
  name: string;
  phoneDigits: string;
  verifiedPhone: string;
  rides: number;
  completedRides: number;
  spendMinor: number;
  currency: string;
  firstRideAt: string | null;
  lastRideAt: string | null;
  hasUpcoming: boolean;
  locale: string;
  emailConsent: CustomerConsentValue;
  whatsappConsent: CustomerConsentValue;
  createdAt: string;
};

export type CustomerListPage = {
  ok: true;
  rows: CustomerListRow[];
  nextCursor: string | null;
};

export type CustomerListFailure = {
  ok: false;
  error: "invalid_cursor";
};

export type CustomerListResult = CustomerListPage | CustomerListFailure;

export type CustomerListResponse = {
  success: true;
  rows: CustomerListRow[];
  nextCursor: string | null;
};

/** Lean Mongoose projection used by the list query. */
export type CustomerListDoc = {
  emailLower: string;
  nameLower?: string;
  name: string;
  phoneDigits: string;
  verifiedPhone: string;
  rideCount: number;
  completedCount: number;
  totalSpendMinor: number;
  currency: string;
  firstRideAt: Date | null;
  lastRideAt: Date | null;
  hasUpcoming: boolean;
  locale: string;
  emailConsent?: CustomerConsentValue;
  whatsappConsent?: CustomerConsentValue;
  createdAt: Date;
};
