import { connectDB } from "@/shared/db";
import ClickEvent from "@/features/marketing/model/ClickEvent";
import MarketingConsent from "@/features/marketing/model/MarketingConsent";
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

const UNSUBSCRIBE_SOURCES = ["unsubscribe_link", "whatsapp_stop"];

/** Pure tally of recipient rows by delivery outcome. */
export function tallyRecipients(
  recipients: Array<{ status?: unknown }>,
): Pick<CampaignReportSummary, "targeted" | "pending" | "sent" | "failed" | "skipped"> {
  const out = { targeted: recipients.length, pending: 0, sent: 0, failed: 0, skipped: 0 };
  for (const r of recipients) {
    const status = typeof r.status === "string" ? r.status : "";
    if (status === "sent") out.sent += 1;
    else if (status === "failed") out.failed += 1;
    else if (status.startsWith("skipped")) out.skipped += 1;
    else out.pending += 1;
  }
  return out;
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

function statNumber(stats: Record<string, unknown>, key: string) {
  const v = stats[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Report metrics. Read-only; counts unsubscribes from recipients after the campaign started. */
export async function buildCampaignReportSummary(
  campaign: CampaignView,
  recipients: Array<Record<string, unknown>>,
): Promise<CampaignReportSummary> {
  await connectDB();
  const tally = tallyRecipients(recipients);
  const ids = [campaign.id];
  const [opened, clicked] = await Promise.all(
    (["open", "click"] as const).map(async (type) => {
      const distinct = await ClickEvent.distinct("recipientId", {
        campaignId: { $in: ids },
        type,
      });
      return distinct.filter((v: unknown) => v !== null && v !== undefined).length;
    }),
  );

  const emails = recipients
    .filter((r) => r.status === "sent")
    .map((r) => r.emailLower)
    .filter((e): e is string => typeof e === "string");
  const since = new Date(campaign.scheduledAt ?? campaign.createdAt);
  let unsubscribed = 0;
  if (emails.length > 0 && !Number.isNaN(since.getTime())) {
    const found = await MarketingConsent.distinct("emailLower", {
      emailLower: { $in: emails },
      channel: campaign.channel,
      status: "withdrawn",
      source: { $in: UNSUBSCRIBE_SOURCES },
      at: { $gte: since },
    });
    unsubscribed = found.length;
  }

  return {
    ...tally,
    opened,
    clicked,
    unsubscribed,
    bookingsAfter: statNumber(campaign.stats, "bookingsAttributed"),
  };
}
