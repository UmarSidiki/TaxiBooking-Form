import mongoose from "mongoose";
import { Booking } from "@/features/booking/model";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import { statsEmailKey } from "@/features/customers-admin/lib/customer-stats/aggregate-customer-stats";
import type {
  CustomerStatsBooking,
  CustomerStatsProfile,
  CustomerStatsRow,
} from "@/features/customers-admin/lib/customer-stats/customer-stats.types";

export const STATS_BOOKING_FIELDS = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "locale",
  "status",
  "paymentStatus",
  "totalAmount",
  "amountPaidCents",
  "amountRefundedCents",
  "cashCollected",
  "date",
  "time",
  "createdAt",
].join(" ");

export type StatsBookingDoc = CustomerStatsBooking & { _id: unknown };

/** Exact, case-insensitive email match. Uses the collated Booking.email index. */
export async function findBookingsForEmail(email: string): Promise<StatsBookingDoc[]> {
  return Booking.find({ email: email.trim() })
    .collation({ locale: "en", strength: 2 })
    .select(STATS_BOOKING_FIELDS)
    .lean<StatsBookingDoc[]>();
}

/** `_id` keyset page: no skip, no regex, bounded memory. */
export async function loadBookingChunk(
  afterId: string | null,
  limit: number,
): Promise<StatsBookingDoc[]> {
  const filter = afterId ? { _id: { $gt: new mongoose.Types.ObjectId(afterId) } } : {};
  return Booking.find(filter)
    .sort({ _id: 1 })
    .limit(limit)
    .select(STATS_BOOKING_FIELDS)
    .lean<StatsBookingDoc[]>();
}

export async function loadProfilesFor(
  emailLowers: string[],
): Promise<Map<string, CustomerStatsProfile>> {
  if (emailLowers.length === 0) return new Map();
  const profiles = await CustomerProfile.find({ email: { $in: emailLowers } })
    .select("email name verifiedPhone language")
    .lean<CustomerStatsProfile[]>();
  return new Map(
    profiles.map((profile) => [statsEmailKey(profile.email), profile] as const),
  );
}

export function withProfileDefaults(
  row: CustomerStatsRow,
  profile?: CustomerStatsProfile,
): CustomerStatsRow {
  return {
    ...row,
    name: row.name || (profile?.name ?? "").trim(),
    verifiedPhone: (profile?.verifiedPhone ?? "").trim(),
    locale: row.locale || profile?.language || "en",
  };
}

export async function writeCustomerStatsRows(
  rows: CustomerStatsRow[],
  rebuiltAt: Date,
  batchSize = 500,
): Promise<number> {
  let written = 0;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    await CustomerStats.bulkWrite(
      batch.map((row) => ({
        updateOne: {
          filter: { emailLower: row.emailLower },
          update: {
            $set: {
              ...row,
              nameLower: row.name.trim().toLowerCase(),
              rebuiltAt,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    written += batch.length;
  }
  return written;
}

export async function deleteStaleCustomerStats(before: Date): Promise<number> {
  const result = await CustomerStats.deleteMany({ rebuiltAt: { $lt: before } });
  return result.deletedCount ?? 0;
}

export async function deleteCustomerStats(emailLower: string): Promise<void> {
  await CustomerStats.deleteOne({ emailLower });
}
