import type { CustomerConsentValue } from "@/features/customers-admin/lib/customer-list/customer-list.types";

/** Fields the customer profile API returns. Dates are ISO strings. */
export type CustomerProfileHeader = {
  email: string;
  name: string;
  phoneDigits: string;
  verifiedPhone: string;
  locale: string;
  rides: number;
  completedRides: number;
  spendMinor: number;
  currency: string;
  firstRideAt: string | null;
  lastRideAt: string | null;
  hasUpcoming: boolean;
  emailConsent: CustomerConsentValue;
  whatsappConsent: CustomerConsentValue;
};

export type CustomerBookingRow = {
  id: string;
  tripId: string;
  date: string;
  time: string;
  pickup: string;
  dropoff: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalMinor: number;
  paidMinor: number;
  refundedMinor: number;
  createdAt: string | null;
};

export type CustomerPaymentKind = "payment" | "refund" | "ride_charge";

export type CustomerPaymentRow = {
  id: string;
  kind: CustomerPaymentKind;
  tripId: string;
  amountMinor: number;
  status: string;
  method: string;
  at: string | null;
};

export type CustomerSessionStatus = "active" | "revoked" | "expired";

export type CustomerSessionRow = {
  id: string;
  deviceFamily: "mobile" | "desktop" | "unknown";
  ipPrefix: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: CustomerSessionStatus;
};

export type CustomerWhatsAppInfo = {
  verifiedPhone: string;
  verifiedAt: string | null;
  consent: CustomerConsentValue;
  lastSend: {
    at: string;
    status: string;
    kind: string;
  } | null;
};

export type CustomerProfilePayload = {
  header: CustomerProfileHeader;
  bookings: CustomerBookingRow[];
  bookingsCapped: boolean;
  payments: CustomerPaymentRow[];
  sessions: CustomerSessionRow[];
  whatsapp: CustomerWhatsAppInfo;
};

export type CustomerProfileResponse = {
  success: true;
  data: CustomerProfilePayload;
};
