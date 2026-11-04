import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { getCampaignTemplate } from "@/features/marketing/lib/templates/campaign-template.repo";
import { renderCampaignTemplate } from "@/features/marketing/lib/templates/render-template";
import {
  buildTemplateVariables,
  type TemplateVariableValues,
} from "@/features/marketing/lib/templates/template-variables";
import { pickSegmentCustomer } from "@/features/marketing/lib/segments/pick-segment-customer";
import { getSegment } from "@/features/marketing/lib/segments/segment.repo";
import { signUnsubscribeToken } from "@/features/marketing/lib/unsubscribe/unsubscribe-token";
import { unsubscribePageUrl } from "@/features/marketing/lib/unsubscribe/unsubscribe-url";
import { DEFAULT_TEMPLATE_LOCALE } from "@/features/marketing/schema/campaign-template.schema";
import type { CampaignTemplateView } from "@/features/marketing/lib/templates/campaign-template.repo";

export type TemplatePreviewFailure =
  | "template_not_found"
  | "segment_not_found"
  | "customer_not_in_segment";

export type TemplatePreview = {
  template: CampaignTemplateView;
  customer: { email: string; name: string; locale: string };
  locale: string;
  fallbackUsed: boolean;
  subject: string;
  preheader: string;
  body: string;
  text: string;
  missingVariables: string[];
};

function variableValues(input: {
  customer: { email: string; name: string; rideCount: number; lastRideAt: Date | null };
  channel: "email" | "whatsapp";
  locale: string;
  baseUrl: string;
}): TemplateVariableValues {
  const token = signUnsubscribeToken({
    email: input.customer.email,
    channel: input.channel,
    locale: input.locale,
  });
  return buildTemplateVariables({
    customer: {
      name: input.customer.name,
      lastRideAt: input.customer.lastRideAt,
      rideCount: input.customer.rideCount,
    },
    locale: input.locale,
    bookingUrl: input.baseUrl ? `${input.baseUrl}/${input.locale}` : "",
    promoCode: "",
    unsubscribeUrl: token
      ? unsubscribePageUrl(input.baseUrl, input.locale, token)
      : "",
  });
}

/**
 * Renders the template against one real customer from the segment. Read-only:
 * nothing is stored or sent.
 */
export async function previewCampaignTemplate(input: {
  templateId: string;
  segmentId: string;
  email?: string | null;
  locale?: string;
}): Promise<
  { ok: true; preview: TemplatePreview } | { ok: false; error: TemplatePreviewFailure }
> {
  const [template, segment] = await Promise.all([
    getCampaignTemplate(input.templateId),
    getSegment(input.segmentId),
  ]);
  if (!template) return { ok: false, error: "template_not_found" };
  if (!segment) return { ok: false, error: "segment_not_found" };

  const locale = input.locale || DEFAULT_TEMPLATE_LOCALE;
  const customer = await pickSegmentCustomer(
    segment.filter,
    template.channel,
    input.email,
  );
  if (!customer) return { ok: false, error: "customer_not_in_segment" };

  const baseUrl = (await resolvePublicUrl()) ?? "";
  const values = variableValues({
    customer,
    channel: template.channel,
    locale,
    baseUrl,
  });
  const rendered = renderCampaignTemplate({
    channel: template.channel,
    locales: template.locales,
    locale,
    fallbackLocale: DEFAULT_TEMPLATE_LOCALE,
    values,
  });
  if (!rendered) return { ok: false, error: "template_not_found" };

  return {
    ok: true,
    preview: {
      template,
      customer: {
        email: customer.email,
        name: customer.name,
        locale: customer.locale,
      },
      locale: rendered.locale,
      fallbackUsed: rendered.fallbackUsed,
      subject: rendered.subject,
      preheader: rendered.preheader,
      body: rendered.body,
      text: rendered.text,
      missingVariables: rendered.missingVariables,
    },
  };
}
