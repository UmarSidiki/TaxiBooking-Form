import mongoose from "mongoose";

import { connectDB } from "@/shared/db";
import CampaignRecipient from "@/features/marketing/model/CampaignRecipient";
import ClickEvent from "@/features/marketing/model/ClickEvent";
import MarketingConsent from "@/features/marketing/model/MarketingConsent";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import type { CampaignView } from "@/features/marketing/lib/campaigns/campaign.repo";

export type CampaignReportSummary = {
  targeted: number;
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bookingsAfter: number;
};

export type CampaignRecipientRow = {
  id: string;
  email: string;
  status: string;
  sentAt: string | null;
  error: string;
};

export const RECIPIENT_BUCKETS = ["sent", "failed", "skipped", "pending"] as const;
export type RecipientBucket = (typeof RECIPIENT_BUCKETS)[number];

const UNSUBSCRIBE_SOURCES = ["unsubscribe_link", "whatsapp_stop"];
export const RECIPIENT_PAGE_MAX = 200;

/** Pure: fold raw status counts into report buckets. */
export function tallyStatusCounts(
  counts: Record<string, number>,
): Pick<CampaignReportSummary, "targeted" | "pending" | "sent" | "failed" | "skipped"> {
  const out = { targeted: 0, pending: 0, sent: 0, failed: 0, skipped: 0 };
  for (const [status, n] of Object.entries(counts)) {
    out.targeted += n;
    if (status === "sent") out.sent += n;
    else if (status === "failed") out.failed += n;
    else if (status.startsWith("skipped")) out.skipped += n;
    else out.pending += n;
  }
  return out;
}

/** Mongo status filter for a bucket. */
export function bucketStatusFilter(bucket: RecipientBucket | "all"): Record<string, unknown> {
  if (bucket === "all") return {};
  if (bucket === "sent" || bucket === "failed") return { status: bucket };
  if (bucket === "skipped") return { status: { $regex: "^skipped" } };
  return { status: { $in: ["pending", "sending"] } };
}

export function toRecipientRow(r: Record<string, unknown>): CampaignRecipientRow {
  const sentAt = r.sentAt ? new Date(r.sentAt as string | Date) : null;
  return {
    id: String(r._id ?? ""),
    email: typeof r.emailLower === "string" ? r.emailLower : "",
    status: typeof r.status === "string" ? r.status : "pending",
    sentAt: sentAt && !Number.isNaN(sentAt.getTime()) ? sentAt.toISOString() : null,
    error: typeof r.error === "string" ? r.error.slice(0, 200) : "",
  };
}

function oid(id: string) {
  return new mongoose.Types.ObjectId(id);
}

/** One page of recipients, newest-first by _id, filtered server-side. */
export async function listRecipientPage(
  campaignId: string,
  options: { bucket?: RecipientBucket | "all"; cursor?: string | null; limit?: number } = {},
): Promise<{ rows: CampaignRecipientRow[]; nextCursor: string | null }> {
  if (!isObjectIdString(campaignId)) return { rows: [], nextCursor: null };
  await connectDB();
  const limit = Math.min(Math.max(options.limit ?? 50, 1), RECIPIENT_PAGE_MAX);
  const query: Record<string, unknown> = {
    campaignId: oid(campaignId),
    ...bucketStatusFilter(options.bucket ?? "all"),
  };
  if (options.cursor && isObjectIdString(options.cursor)) {
    query._id = { $gt: oid(options.cursor) };
  }
  const docs = await CampaignRecipient.find(query)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .select({ emailLower: 1, status: 1, sentAt: 1, error: 1 })
    .lean<Array<Record<string, unknown>>>();
  const page = docs.slice(0, limit);
  return {
    rows: page.map(toRecipientRow),
    nextCursor: docs.length > limit ? String(page[page.length - 1]._id) : null,
  };
}

async function countUnsubscribes(campaign: CampaignView): Promise<number> {
  const since = new Date(campaign.scheduledAt ?? campaign.createdAt);
  if (Number.isNaN(since.getTime())) return 0;
  // Withdrawals by people this campaign reached, after it went out. Runs in Mongo, no row cap.
  const rows = await MarketingConsent.aggregate<{ n: number }>([
    {
      $match: {
        channel: campaign.channel,
        status: "withdrawn",
        source: { $in: UNSUBSCRIBE_SOURCES },
        at: { $gte: since },
      },
    },
    { $group: { _id: "$emailLower" } },
    {
      $lookup: {
        from: CampaignRecipient.collection.name,
        let: { email: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$campaignId", oid(campaign.id)] },
                  { $eq: ["$emailLower", "$$email"] },
                  { $eq: ["$status", "sent"] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "hit",
      },
    },
    { $match: { "hit.0": { $exists: true } } },
    { $count: "n" },
  ]);
  return rows[0]?.n ?? 0;
}

function statNumber(stats: Record<string, unknown>, key: string) {
  const v = stats[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Report metrics over every recipient (no 500 cap). Read-only. */
export async function buildCampaignReportSummary(
  campaign: CampaignView,
): Promise<CampaignReportSummary> {
  await connectDB();
  const grouped = await CampaignRecipient.aggregate<{ _id: string; n: number }>([
    { $match: { campaignId: oid(campaign.id) } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const counts: Record<string, number> = {};
  for (const g of grouped) counts[String(g._id ?? "pending")] = g.n;

  const [opened, clicked, unsubscribed] = await Promise.all([
    ...(["open", "click"] as const).map(async (type) => {
      const distinct = await ClickEvent.distinct("recipientId", {
        campaignId: { $in: [campaign.id, oid(campaign.id)] },
        type,
      });
      return distinct.filter((v: unknown) => v !== null && v !== undefined).length;
    }),
    countUnsubscribes(campaign),
  ]);

  return {
    ...tallyStatusCounts(counts),
    opened,
    clicked,
    unsubscribed,
    bookingsAfter: statNumber(campaign.stats, "bookingsAttributed"),
  };
}
