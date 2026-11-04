import { connectDB } from "@/shared/db";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import { buildCustomerListFilter } from "@/features/customers-admin/lib/customer-list/customer-list-filter";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";
import {
  segmentFilterForChannel,
  type SegmentFilter,
} from "@/features/marketing/schema/segment.schema";

export type SegmentCustomer = {
  email: string;
  name: string;
  rideCount: number;
  lastRideAt: Date | null;
  locale: string;
};

const PICK_FIELDS = "emailLower name rideCount lastRideAt locale";

/**
 * A real customer from the segment, used only for previews and test copy.
 * When `email` is given it must still match the segment and the channel gate.
 */
export async function pickSegmentCustomer(
  filter: SegmentFilter,
  channel: MarketingChannel,
  email?: string | null,
  now = new Date(),
): Promise<SegmentCustomer | null> {
  const base = buildCustomerListFilter(segmentFilterForChannel(filter, channel), now);
  if (!base) return null;

  const wanted = (email ?? "").trim().toLowerCase();
  const query = wanted
    ? { $and: [base, { emailLower: wanted }] }
    : base;

  await connectDB();
  const doc = await CustomerStats.findOne(query)
    .select(PICK_FIELDS)
    .sort({ lastRideAt: -1 })
    .lean<{
      emailLower: string;
      name: string;
      rideCount: number;
      lastRideAt: Date | null;
      locale: string;
    } | null>();

  if (!doc) return null;
  return {
    email: doc.emailLower,
    name: doc.name ?? "",
    rideCount: doc.rideCount ?? 0,
    lastRideAt: doc.lastRideAt ?? null,
    locale: doc.locale || "en",
  };
}
