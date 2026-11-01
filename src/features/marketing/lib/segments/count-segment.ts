import { connectDB } from "@/shared/db";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import { buildCustomerListFilter } from "@/features/customers-admin/lib/customer-list/customer-list-filter";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";
import {
  segmentFilterBase,
  segmentFilterForChannel,
  type SegmentFilter,
} from "@/features/marketing/schema/segment.schema";

export type SegmentCount = {
  channel: MarketingChannel;
  /** Rows matching the saved audience before the channel consent gate. */
  total: number;
  /** Rows that may actually receive this channel. */
  eligible: number;
  excluded: number;
};

function countOf(
  filter: SegmentFilter,
  channel: MarketingChannel,
  now: Date,
): Promise<number> {
  const query = buildCustomerListFilter(
    segmentFilterForChannel(filter, channel),
    now,
  );
  if (!query) return Promise.resolve(0);
  return CustomerStats.countDocuments(query);
}

/** Live audience size. Consent (and a verified number for WhatsApp) always applies. */
export async function countSegmentMembers(
  filter: SegmentFilter,
  channel: MarketingChannel,
  now = new Date(),
): Promise<SegmentCount> {
  await connectDB();
  const base = buildCustomerListFilter(segmentFilterBase(filter), now);
  const [total, eligible] = await Promise.all([
    base ? CustomerStats.countDocuments(base) : Promise.resolve(0),
    countOf(filter, channel, now),
  ]);
  return { channel, total, eligible, excluded: Math.max(0, total - eligible) };
}
