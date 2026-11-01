import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import type { CustomerConsentValue } from "@/features/customers-admin/lib/customer-list/customer-list.types";

export const PROFILE_BOOKINGS_LIMIT = 100;

export type ProfileStatsDoc = {
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
  emailConsent?: CustomerConsentValue;
  whatsappConsent?: CustomerConsentValue;
};

export type ProfileCustomerDoc = {
  email: string;
  name?: string | null;
  phone?: string | null;
  verifiedPhone?: string | null;
  verifiedPhoneAt?: Date | null;
  language?: string | null;
};

export type ProfileBookingDoc = {
  _id: unknown;
  tripId: string;
  pickup: string;
  dropoff?: string | null;
  date: string;
  time: string;
  status?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  totalAmount?: number | null;
  amountPaidCents?: number | null;
  amountRefundedCents?: number | null;
  refundAmount?: number | null;
  createdAt?: Date | null;
};

const BOOKING_FIELDS = [
  "tripId",
  "pickup",
  "dropoff",
  "date",
  "time",
  "status",
  "paymentStatus",
  "paymentMethod",
  "totalAmount",
  "amountPaidCents",
  "amountRefundedCents",
  "refundAmount",
  "createdAt",
].join(" ");

export async function findCustomerStats(
  emailLower: string,
): Promise<ProfileStatsDoc | null> {
  await connectDB();
  return CustomerStats.findOne({ emailLower }).lean<ProfileStatsDoc | null>();
}

export async function findCustomerProfile(
  emailLower: string,
): Promise<ProfileCustomerDoc | null> {
  await connectDB();
  return CustomerProfile.findOne({ email: emailLower })
    .collation({ locale: "en", strength: 2 })
    .select("email name phone verifiedPhone verifiedPhoneAt language")
    .lean<ProfileCustomerDoc | null>();
}

export async function findCustomerBookings(
  email: string,
): Promise<ProfileBookingDoc[]> {
  await connectDB();
  return Booking.find({ email })
    .collation({ locale: "en", strength: 2 })
    .select(BOOKING_FIELDS)
    .sort({ createdAt: -1 })
    .limit(PROFILE_BOOKINGS_LIMIT + 1)
    .lean<ProfileBookingDoc[]>();
}

/** Whether any customer-owned record exists for this email. */
export async function customerExists(emailLower: string): Promise<boolean> {
  await connectDB();
  const [stats, profile, booking] = await Promise.all([
    CustomerStats.exists({ emailLower }),
    CustomerProfile.exists({ email: emailLower }),
    Booking.findOne({ email: emailLower })
      .collation({ locale: "en", strength: 2 })
      .select("_id")
      .lean<{ _id: unknown } | null>(),
  ]);
  return Boolean(stats || profile || booking);
}
