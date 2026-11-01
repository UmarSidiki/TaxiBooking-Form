import { connectDB } from "@/shared/db";
import Campaign from "@/features/marketing/model/Campaign";
import CampaignRecipient from "@/features/marketing/model/CampaignRecipient";
import CampaignTemplate from "@/features/marketing/model/CampaignTemplate";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import Setting from "@/features/settings/model/Setting";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import { checkMarketingEligibility } from "@/features/marketing/lib/eligibility/marketing-eligibility";
import { isMarketingQuietHours } from "@/features/marketing/lib/eligibility/quiet-hours";
import { signUnsubscribeToken } from "@/features/marketing/lib/unsubscribe/unsubscribe-token";
import { buildTemplateVariables } from "@/features/marketing/lib/templates/template-variables";
import { renderCampaignTemplate } from "@/features/marketing/lib/templates/render-template";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-send";
import { countWhatsAppSendsToday } from "@/features/settings/lib/whatsapp-send-log";
import { claimRecipient } from "@/features/marketing/lib/campaigns/claim-recipient";
import {
  WHATSAPP_MARKETING_DAILY_CAP,
  WHATSAPP_MARKETING_PER_TICK,
} from "@/features/marketing/lib/marketing.constants";

export type ProcessWhatsAppCampaignInput = {
  now: Date;
  clock: () => number;
  deadlineMs: number;
  leaseMs: number;
  sleep?: (ms: number) => Promise<void>;
  rng?: () => number;
  sendWhatsApp?: typeof sendWhatsAppTexts;
  tickBudget?: number;
};

export type ProcessWhatsAppCampaignResult = {
  sent: number;
  failed: number;
  skipped: number;
  attempted: number;
  paused: boolean;
};

async function incStats(campaignId: unknown, patch: Record<string, number>) {
  const inc: Record<string, number> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value) inc[`stats.${key}`] = (inc[`stats.${key}`] ?? 0) + value;
  }
  if (Object.keys(inc).length === 0) return;
  await Campaign.updateOne({ _id: campaignId }, { $inc: inc });
}

export async function processWhatsAppCampaign(
  campaignId: string,
  options: ProcessWhatsAppCampaignInput,
): Promise<ProcessWhatsAppCampaignResult> {
  await connectDB();
  const result: ProcessWhatsAppCampaignResult = {
    sent: 0,
    failed: 0,
    skipped: 0,
    attempted: 0,
    paused: false,
  };

  const campaign = await Campaign.findById(campaignId).lean<{
    _id: unknown;
    channel: string;
    status: string;
    quietHours?: { timeZone?: string };
    templateId?: unknown;
  } | null>();
  if (!campaign) return result;

  const settings = await Setting.findOne()
    .lean<{
      timezone?: string;
      marketingWhatsappDailyCap?: number;
    } | null>();

  const tz = campaign.quietHours?.timeZone || settings?.timezone || "UTC";
  if (isMarketingQuietHours(options.now, tz)) {
    return result;
  }

  const marketingCap =
    settings?.marketingWhatsappDailyCap ?? WHATSAPP_MARKETING_DAILY_CAP;
  const campaignSentToday = await countWhatsAppSendsToday(
    options.now,
    "campaign",
  );
  const remainingMarketing = Math.max(0, marketingCap - campaignSentToday);
  if (remainingMarketing <= 0) return result;

  const budget = Math.min(
    WHATSAPP_MARKETING_PER_TICK,
    remainingMarketing,
    options.tickBudget ?? WHATSAPP_MARKETING_PER_TICK,
  );
  if (budget <= 0) return result;

  const template =
    campaign.templateId && isObjectIdString(String(campaign.templateId))
      ? await CampaignTemplate.findById(String(campaign.templateId)).lean<{
          locales: Record<string, { subject: string; preheader: string; body: string }>;
          channel: string;
        } | null>()
      : null;

  const baseUrl = (await resolvePublicUrl()) ?? "";

  const recipients = await CampaignRecipient.find({
    campaignId: campaign._id,
    status: { $in: ["pending", "sending"] },
  })
    .sort({ createdAt: 1 })
    .limit(budget)
    .lean<
      Array<{
        _id: unknown;
        emailLower: string;
        locale: string;
        status: string;
      }>
    >();

  const claimed: Array<{
    _id: unknown;
    emailLower: string;
    locale: string;
  }> = [];
  for (const recipient of recipients) {
    const ok = await claimRecipient(
      recipient._id,
      options.leaseMs,
      options.now,
    );
    if (ok) claimed.push(recipient);
  }

  const eligible: Array<{
    recipient: { _id: unknown; emailLower: string; locale: string };
    phoneDigits: string;
  }> = [];

  for (const recipient of claimed) {
    const eligibility = await checkMarketingEligibility({
      email: recipient.emailLower,
      channel: "whatsapp",
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
      result.skipped += 1;
      await incStats(campaign._id, { skipped: 1, skippedCount: 1 });
      continue;
    }
    eligible.push({ recipient, phoneDigits: eligibility.key });
  }

  if (eligible.length === 0) {
    await finalizeCampaign(campaign._id);
    return result;
  }

  const messages: Array<{ jid: string; text: string }> = [];
  const keys: string[] = [];
  const recipientMap: Array<{
    _id: unknown;
    emailLower: string;
  }> = [];

  for (const { recipient, phoneDigits } of eligible) {
    const locale = recipient.locale || "en";
    const statsRow = await CustomerStats.findOne({
      emailLower: recipient.emailLower,
    })
      .select("name rideCount lastRideAt locale")
      .lean<{
        name?: string;
        rideCount?: number;
        lastRideAt?: Date | null;
        locale?: string;
      } | null>();

    const unsubscribeToken = signUnsubscribeToken({
      email: recipient.emailLower,
      channel: "whatsapp",
      locale,
    });
    const unsubscribeUrl = unsubscribeToken
      ? `${baseUrl.replace(/\/+$/, "")}/${locale}/u/${encodeURIComponent(
          unsubscribeToken,
        )}`
      : "";

    const values = buildTemplateVariables({
      customer: {
        name: recipient.emailLower,
        lastRideAt: null,
        rideCount: 0,
        locale,
      },
      locale,
      unsubscribeUrl,
    });
    if (statsRow) {
      values.firstName =
        (statsRow.name ?? "").trim().split(/\s+/)[0] || values.firstName;
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
          channel: "whatsapp",
          locales: template.locales as never,
          locale,
          fallbackLocale: "en",
          values,
        })
      : null;

    const text = rendered?.text || "";
    messages.push({ jid: `${phoneDigits}@s.whatsapp.net`, text });
    keys.push(`campaign:${String(campaign._id)}:${recipient.emailLower}`);
    recipientMap.push({
      _id: recipient._id,
      emailLower: recipient.emailLower,
    });
  }

  const sendFn = options.sendWhatsApp ?? sendWhatsAppTexts;
  const sendResult = await sendFn(messages, {
    kind: "campaign",
    idempotencyKeys: keys,
    sleep: options.sleep,
    rng: options.rng,
    jitterMinMs: 3000,
    jitterMaxMs: 8000,
    handleStops: true,
    deadlineMs: options.deadlineMs,
  });

  let needsScanOrLogout = false;
  if (!sendResult.ok) {
    if (sendResult.reason === "needs_scan") needsScanOrLogout = true;
    // mark claimed recipients as failed? Leave pending for retry? 
    // Auto-pause on needs_scan; keep recipients pending for resume.
  } else {
    for (let i = 0; i < messages.length; i++) {
      const recipient = recipientMap[i];
      const res = sendResult.results[i];
      if (res?.ok) {
        await CampaignRecipient.updateOne(
          { _id: recipient._id },
          { $set: { status: "sent", sentAt: new Date() } },
        );
        result.sent += 1;
        await incStats(campaign._id, { sent: 1, sentCount: 1 });
      } else {
        await CampaignRecipient.updateOne(
          { _id: recipient._id },
          { $set: { status: "failed", error: res?.error || "send_failed" } },
        );
        result.failed += 1;
        await incStats(campaign._id, { failed: 1, failedCount: 1 });
      }
    }
  }

  result.attempted = messages.length;

  const failureRate =
    messages.length > 0 ? result.failed / messages.length : 0;
  const shouldPause =
    needsScanOrLogout || (messages.length > 0 && failureRate > 0.1);
  if (shouldPause) {
    await Campaign.updateOne(
      { _id: campaign._id },
      { $set: { status: "paused" } },
    );
    result.paused = true;
  }

  await finalizeCampaign(campaign._id);
  return result;
}

async function finalizeCampaign(campaignId: unknown) {
  const pendingLeft = await CampaignRecipient.countDocuments({
    campaignId,
    status: { $in: ["pending", "sending"] },
  });
  const current = await Campaign.findById(campaignId)
    .select("status")
    .lean<{ status: string } | null>();
  if (pendingLeft === 0 && current?.status === "sending") {
    await Campaign.updateOne({ _id: campaignId }, { $set: { status: "done" } });
  }
}
