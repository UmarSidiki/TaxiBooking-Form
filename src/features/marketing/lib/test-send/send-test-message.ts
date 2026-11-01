import { connectDB } from "@/shared/db";
import Setting, { type ISetting } from "@/features/settings/model/Setting";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { getCampaignTemplate } from "@/features/marketing/lib/templates/campaign-template.repo";
import { renderCampaignTemplate } from "@/features/marketing/lib/templates/render-template";
import { buildTemplateVariables } from "@/features/marketing/lib/templates/template-variables";
import { sendMarketingEmail } from "@/features/marketing/lib/email/send-marketing-email";
import { signUnsubscribeToken } from "@/features/marketing/lib/unsubscribe/unsubscribe-token";
import { unsubscribePageUrl } from "@/features/marketing/lib/unsubscribe/unsubscribe-url";
import {
  isAllowedTestRecipient,
  type NormalisedRecipient,
} from "@/features/marketing/lib/test-send/staff-allowlist";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-send";
import { DEFAULT_TEMPLATE_LOCALE } from "@/features/marketing/schema/campaign-template.schema";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";

export type TestSendResult =
  | { ok: true; channel: MarketingChannel; recipient: string; sent: boolean }
  | {
      ok: false;
      error:
        | "template_not_found"
        | "recipient_not_allowlisted"
        | "recipient_channel_mismatch";
    };

const DEMO_CUSTOMER = {
  name: "Test Customer",
  rideCount: 1,
  lastRideAt: new Date(),
};

/**
 * Sends one rendered message to a staff test recipient. Test sends never
 * create campaign recipients and never count toward campaign stats.
 */
export async function sendTestMessage(input: {
  templateId: string;
  locale?: string;
  recipient: string;
}): Promise<TestSendResult> {
  const template = await getCampaignTemplate(input.templateId);
  if (!template) return { ok: false, error: "template_not_found" };

  await connectDB();
  const settings = await Setting.findOne()
    .select(
      "marketingTestRecipients marketingSenderName marketingSenderEmail marketingReplyTo smtpFrom smtpSenderName",
    )
    .lean<Partial<ISetting> | null>();

  const allowed = isAllowedTestRecipient(
    input.recipient,
    settings?.marketingTestRecipients,
  );
  if (!allowed) return { ok: false, error: "recipient_not_allowlisted" };

  const channel = template.channel;
  if (channel === "email" && allowed.kind !== "email") {
    return { ok: false, error: "recipient_channel_mismatch" };
  }
  if (channel === "whatsapp" && allowed.kind !== "phone") {
    return { ok: false, error: "recipient_channel_mismatch" };
  }

  const locale = input.locale || DEFAULT_TEMPLATE_LOCALE;
  const baseUrl = (await resolvePublicUrl()) ?? "";
  const token =
    channel === "email"
      ? signUnsubscribeToken({
          email: allowed.key,
          channel,
          locale,
        })
      : null;
  const values = buildTemplateVariables({
    customer: DEMO_CUSTOMER,
    locale,
    bookingUrl: baseUrl ? `${baseUrl}/${locale}` : "",
    promoCode: "",
    unsubscribeUrl: token ? unsubscribePageUrl(baseUrl, locale, token) : "",
  });
  const rendered = renderCampaignTemplate({
    channel,
    locales: template.locales,
    locale,
    fallbackLocale: DEFAULT_TEMPLATE_LOCALE,
    values,
  });
  if (!rendered) return { ok: false, error: "template_not_found" };

  if (channel === "email") {
    const sent = await sendMarketingEmail({
      to: allowed.key,
      subject: rendered.subject,
      html: rendered.body,
      text: rendered.text,
      unsubscribeToken: token ?? "",
      locale,
      baseUrl: baseUrl || null,
      settings,
    });
    return { ok: true, channel, recipient: allowed.key, sent };
  }

  const outcome = await sendWhatsAppTexts(
    [{ jid: (allowed as NormalisedRecipient).key, text: rendered.text }],
    {
      kind: "test",
      idempotencyKeys: [
        `marketing-test:${template.id}:${allowed.key}:${Date.now()}`,
      ],
    },
  );
  return {
    ok: true,
    channel,
    recipient: allowed.key,
    sent: outcome.ok,
  };
}
