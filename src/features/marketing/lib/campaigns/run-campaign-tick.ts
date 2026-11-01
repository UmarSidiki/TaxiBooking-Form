import { connectDB } from "@/shared/db";
import Campaign from "@/features/marketing/model/Campaign";
import CampaignRecipient from "@/features/marketing/model/CampaignRecipient";
import CampaignTemplate from "@/features/marketing/model/CampaignTemplate";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import {
  renderCampaignTemplate,
} from "@/features/marketing/lib/templates/render-template";
import { buildTemplateVariables } from "@/features/marketing/lib/templates/template-variables";
import { checkMarketingEligibility } from "@/features/marketing/lib/eligibility/marketing-eligibility";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { sendMarketingEmail } from "@/features/marketing/lib/email/send-marketing-email";
import { signUnsubscribeToken } from "@/features/marketing/lib/unsubscribe/unsubscribe-token";
import { materialiseCampaignRecipients } from "@/features/marketing/lib/campaigns/materialise-recipients";
import { claimRecipient, reclaimStaleRecipients } from "@/features/marketing/lib/campaigns/claim-recipient";
import { processWhatsAppCampaign } from "@/features/marketing/lib/campaigns/process-whatsapp-campaign";
import CronMarker from "@/features/cron/model/CronMarker";

export type RunCampaignTickOptions = {
  now?: Date;
  deadlineMs?: number;
  maxDurationSeconds?: number;
  recipientLeaseMs?: number;
  sleep?: (ms: number) => Promise<void>;
  rng?: () => number;
  sendWhatsApp?: typeof import("@/features/settings/lib/whatsapp-send").sendWhatsAppTexts;
};

export type RunCampaignTickResult = {
  locked: boolean;
  campaigns?: number;
  sent?: number;
  failed?: number;
  skipped?: number;
};

const CAMPAIGN_LOCK_KEY = "campaign-tick";
const CAMPAIGN_LOCK_LEASE_MS = 4 * 60 * 1000;
const RECIPIENT_LEASE_MS = 2 * 60 * 1000;
const DEFAULT_MAX_DURATION_MS = 50 * 1000;

function connect() { return connectDB(); }

async function acquireLock(now: Date): Promise<boolean> {
  await connect();
  await CronMarker.updateOne(
    { key: CAMPAIGN_LOCK_KEY },
    { $setOnInsert: { lockedUntil: new Date(0) } },
    { upsert: true },
  );
  const acquired = await CronMarker.findOneAndUpdate(
    { key: CAMPAIGN_LOCK_KEY, lockedUntil: { $lte: now } },
    { $set: { lockedUntil: new Date(now.getTime() + CAMPAIGN_LOCK_LEASE_MS) } },
  );
  return Boolean(acquired);
}

async function releaseLock() {
  await CronMarker.updateOne(
    { key: CAMPAIGN_LOCK_KEY },
    { $set: { lockedUntil: new Date(0) } },
  ).catch(() => undefined);
}

async function incStats(campaignId: unknown, patch: Record<string, number>) {
  const inc: Record<string, number> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value) inc[`stats.${key}`] = (inc[`stats.${key}`] ?? 0) + value;
  }
  if (Object.keys(inc).length === 0) return;
  await Campaign.updateOne({ _id: campaignId }, { $inc: inc });
}

export async function runCampaignTick(
  options: RunCampaignTickOptions = {},
): Promise<RunCampaignTickResult> {
  const now = options.now ?? new Date();
  const realNow = Date.now();
  const simulated = Math.abs(now.getTime() - realNow) > 60_000;
  const clock = () => (simulated ? now.getTime() : Date.now());
  const deadlineMs =
    options.deadlineMs ??
    (options.maxDurationSeconds
      ? now.getTime() + options.maxDurationSeconds * 1000 - 10_000
      : now.getTime() + DEFAULT_MAX_DURATION_MS);
  const leaseMs = options.recipientLeaseMs ?? RECIPIENT_LEASE_MS;

  const locked = await acquireLock(now);
  if (!locked) return { locked: false };

  let totalSent = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let campaignsProcessed = 0;
  let whatsappTickRemaining = 20;

  try {
    const campaigns = await Campaign.find({
      status: { $in: ["scheduled", "sending"] },
    })
      .sort({ scheduledAt: 1, createdAt: 1 })
      .lean<
        Array<{
          _id: unknown;
          channel: "email" | "whatsapp";
          status: string;
          scheduledAt?: Date | null;
          segmentId?: unknown;
          templateId?: unknown;
          templateVersion?: number;
          quietHours?: { timeZone?: string };
        }>
      >();

    for (const campaign of campaigns) {
      if (clock() >= deadlineMs) break;

      if (campaign.scheduledAt && new Date(campaign.scheduledAt).getTime() > clock()) {
        continue;
      }

      const recipientCount = await CampaignRecipient.countDocuments({
        campaignId: campaign._id,
      });
      if (recipientCount === 0) {
        await materialiseCampaignRecipients(String(campaign._id));
      }

      await Campaign.updateOne(
        { _id: campaign._id, status: { $in: ["scheduled", "sending"] } },
        { $set: { status: "sending" } },
      );

      await reclaimStaleRecipients(campaign._id, now);

      campaignsProcessed += 1;

      if (campaign.channel === "whatsapp") {
        const wa = await processWhatsAppCampaign(String(campaign._id), {
          now,
          clock,
          deadlineMs,
          leaseMs,
          sleep: options.sleep,
          rng: options.rng,
          sendWhatsApp: options.sendWhatsApp,
          tickBudget: whatsappTickRemaining,
        });
        totalSent += wa.sent;
        totalFailed += wa.failed;
        totalSkipped += wa.skipped;
        whatsappTickRemaining = Math.max(
          0,
          whatsappTickRemaining - wa.attempted,
        );
        continue;
      }

      const template = campaign.templateId && isObjectIdString(String(campaign.templateId))
        ? await CampaignTemplate.findById(String(campaign.templateId)).lean<{
            locales: Record<string, { subject: string; preheader: string; body: string }>;
            channel: string;
          } | null>()
        : null;

      const baseUrl = (await resolvePublicUrl()) ?? "";

      while (clock() < deadlineMs) {
        const current = await Campaign.findById(campaign._id)
          .select("status")
          .lean<{ status: string } | null>();
        if (!current || current.status === "paused" || current.status === "cancelled" || current.status === "done") {
          break;
        }

        const recipient = await CampaignRecipient.findOne({
          campaignId: campaign._id,
          status: { $in: ["pending", "sending"] },
        })
          .sort({ createdAt: 1 })
          .lean<{
            _id: unknown;
            emailLower: string;
            locale: string;
            status: string;
          } | null>();

        if (!recipient) break;

        const claimed = await claimRecipient(recipient._id, leaseMs, new Date());
        if (!claimed) continue;

        const fresh = await CampaignRecipient.findById(recipient._id).lean<{
          status: string;
          sentAt?: Date | null;
        } | null>();
        if (fresh?.status === "sent" || fresh?.sentAt) {
          continue;
        }

        const eligibility = await checkMarketingEligibility({
          email: recipient.emailLower,
          channel: "email",
        });
        if (!eligibility.eligible) {
          const skipStatus =
            eligibility.reason === "suppressed"
              ? "skipped_suppressed"
              : "skipped_consent";
          await CampaignRecipient.updateOne(
            { _id: recipient._id },
            { $set: { status: skipStatus } },
          );
          totalSkipped += 1;
          await incStats(campaign._id, { skipped: 1, skippedCount: 1 });
          continue;
        }

        const locale = recipient.locale || "en";
        const unsubscribeToken = signUnsubscribeToken({
          email: recipient.emailLower,
          channel: "email",
          locale,
        });
        const unsubscribeUrl = unsubscribeToken
          ? `${baseUrl.replace(/\/+$/, "")}/${locale}/u/${encodeURIComponent(unsubscribeToken)}`
          : "";

        const values = buildTemplateVariables({
          customer: { name: recipient.emailLower, lastRideAt: null, rideCount: 0, locale },
          locale,
          unsubscribeUrl,
        });

        const statsRow = (await CustomerStats.findOne({ emailLower: recipient.emailLower })
            .select("name rideCount lastRideAt locale")
            .lean()) as {
              name?: string;
              rideCount?: number;
              lastRideAt?: Date | null;
              locale?: string;
            } | null;
        if (statsRow) {
            values.firstName = (statsRow.name ?? "").trim().split(/\s+/)[0] ?? values.firstName;
            values.rideCount = String(statsRow.rideCount ?? 0);
            if (statsRow.lastRideAt) {
              try {
                values.lastRideDate = new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeZone: "UTC",
                }).format(statsRow.lastRideAt);
              } catch {
                // ignore
              }
            }
          }

        const rendered = template
          ? renderCampaignTemplate({
              channel: "email",
              locales: template.locales as never,
              locale,
              fallbackLocale: "en",
              values,
            })
          : null;

        const subject = rendered?.subject || "Update";
        const html = rendered?.body || "";
        const text = rendered?.text;

        const sent = await sendMarketingEmail({
          to: recipient.emailLower,
          subject,
          html,
          text,
          unsubscribeToken: unsubscribeToken ?? "",
          locale,
          baseUrl,
        });

        if (sent) {
          await CampaignRecipient.updateOne(
            { _id: recipient._id },
            { $set: { status: "sent", sentAt: new Date() } },
          );
          totalSent += 1;
          await incStats(campaign._id, { sent: 1, sentCount: 1 });
        } else {
          await CampaignRecipient.updateOne(
            { _id: recipient._id },
            { $set: { status: "failed", error: "send_failed" } },
          );
          totalFailed += 1;
          await incStats(campaign._id, { failed: 1, failedCount: 1 });
        }
      }

      const pendingLeft = await CampaignRecipient.countDocuments({
        campaignId: campaign._id,
        status: { $in: ["pending", "sending"] },
      });
      const current = await Campaign.findById(campaign._id)
        .select("status")
        .lean<{ status: string } | null>();
      if (pendingLeft === 0 && current?.status === "sending") {
        await Campaign.updateOne({ _id: campaign._id }, { $set: { status: "done" } });
      }
    }
  } finally {
    await releaseLock();
  }

  return {
    locked: true,
    campaigns: campaignsProcessed,
    sent: totalSent,
    failed: totalFailed,
    skipped: totalSkipped,
  };
}