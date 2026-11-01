import { connectDB } from "@/shared/db";
import Campaign from "@/features/marketing/model/Campaign";
import CampaignRecipient from "@/features/marketing/model/CampaignRecipient";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import Suppression from "@/features/marketing/model/Suppression";
import { getSegment } from "@/features/marketing/lib/segments/segment.repo";
import { buildCustomerListFilter } from "@/features/customers-admin/lib/customer-list/customer-list-filter";
import {
  segmentFilterForChannel,
  type SegmentFilter,
} from "@/features/marketing/schema/segment.schema";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";

export type MaterialiseResult = {
  campaignId: string;
  materialised: number;
  excluded: number;
  total: number;
};

function toId(value: unknown): string {
  return String(value);
}

/** Enumerate the audience for a campaign and create pending recipient rows. */
export async function materialiseCampaignRecipients(
  campaignId: string,
): Promise<MaterialiseResult> {
  await connectDB();
  const campaign = await Campaign.findById(campaignId).lean<{
    _id: unknown;
    channel: MarketingChannel;
    segmentId: unknown;
    stats?: Record<string, unknown>;
  } | null>();
  if (!campaign) {
    return { campaignId, materialised: 0, excluded: 0, total: 0 };
  }

  const channel = campaign.channel;
  const segment = campaign.segmentId
    ? await getSegment(String(campaign.segmentId))
    : null;
  const filter: SegmentFilter | null = segment?.filter ?? null;

  // Base audience (before consent gate) for excluded counting.
  let baseQuery: Record<string, unknown> | null = null;
  let channelQuery: Record<string, unknown> | null = null;
  if (filter) {
    baseQuery = buildCustomerListFilter(
      { ...filter, sort: "last-ride", dir: "desc", cursor: undefined } as never,
      new Date(),
    );
    channelQuery = buildCustomerListFilter(
      segmentFilterForChannel(filter, channel),
      new Date(),
    );
  }

  const candidates = channelQuery
    ? await CustomerStats.find(channelQuery)
        .select("emailLower verifiedPhone locale")
        .lean<
          Array<{ emailLower: string; verifiedPhone?: string; locale?: string }>
        >()
    : [];
  const baseTotal = baseQuery
    ? await CustomerStats.countDocuments(baseQuery)
    : candidates.length;

  // Filter out suppressed keys.
  const suppressedKeys = new Set<string>();
  if (candidates.length > 0) {
    const keys = candidates.map((row) =>
      channel === "email"
        ? row.emailLower
        : String(row.verifiedPhone ?? "").replace(/\D/g, ""),
    );
    const rows = await Suppression.find({
      channel,
      key: { $in: keys },
    })
      .select("key")
      .lean<Array<{ key: string }>>();
    for (const row of rows) suppressedKeys.add(row.key);
  }

  let materialised = 0;
  for (const candidate of candidates) {
    const key =
      channel === "email"
        ? candidate.emailLower
        : String(candidate.verifiedPhone ?? "").replace(/\D/g, "");
    if (suppressedKeys.has(key)) continue;

    const idempotencyKey = `campaign:${campaignId}:${candidate.emailLower}`;
    try {
      await CampaignRecipient.create({
        campaignId: campaign._id,
        emailLower: candidate.emailLower,
        locale: candidate.locale || "en",
        status: "pending",
        idempotencyKey,
        attempts: 0,
      });
      materialised += 1;
    } catch {
      // duplicate recipient or key: ignore
    }
  }

  const excluded = Math.max(0, baseTotal - materialised);
  const stats = {
    targeted: materialised,
    excluded,
    total: baseTotal,
    sent: 0,
    failed: 0,
    skipped: 0,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    targetedCount: materialised,
    excludedCount: excluded,
    totalCount: baseTotal,
  };

  await Campaign.updateOne(
    { _id: campaign._id },
    { $set: { stats, status: "scheduled" } },
  );

  return {
    campaignId: toId(campaign._id),
    materialised,
    excluded,
    total: baseTotal,
  };
}

export const materializeCampaignRecipients = materialiseCampaignRecipients;
export const materialiseRecipients = materialiseCampaignRecipients;
export const materializeRecipients = materialiseCampaignRecipients;
export const startCampaign = materialiseCampaignRecipients;