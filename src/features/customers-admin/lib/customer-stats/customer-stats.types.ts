/** Booking fields CustomerStats is derived from (a lean projection). */
export type CustomerStatsBooking = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  locale?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  totalAmount?: number | null;
  amountPaidCents?: number | null;
  amountRefundedCents?: number | null;
  cashCollected?: number | null;
  date?: string | null;
  time?: string | null;
  createdAt?: Date | string | null;
};

export type CustomerStatsRow = {
  emailLower: string;
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
};

/** A row plus the sort key used to merge chunks of the same customer. */
export type CustomerStatsAggregate = CustomerStatsRow & {
  latestBookingAt: number;
};

export type CustomerStatsProfile = {
  email?: string | null;
  name?: string | null;
  verifiedPhone?: string | null;
  language?: string | null;
};
