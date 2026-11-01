import { extractTemplateVariables } from "@/features/marketing/schema/campaign-template.schema";
import type {
  MarketingTemplate,
  MarketingTemplateLocale,
} from "@/features/marketing/ui/marketing-ui.types";

export const EMPTY_TEMPLATE_LOCALE: MarketingTemplateLocale = {
  subject: "",
  preheader: "",
  body: "",
};

export type MarketingTemplateDraft = {
  channel: "email" | "whatsapp";
  name: string;
  locales: Record<string, MarketingTemplateLocale>;
};

export function draftFromTemplate(
  template: MarketingTemplate | null,
): MarketingTemplateDraft {
  if (!template) {
    return {
      channel: "email",
      name: "",
      locales: { en: { ...EMPTY_TEMPLATE_LOCALE } },
    };
  }
  const locales: Record<string, MarketingTemplateLocale> = {};
  for (const [locale, content] of Object.entries(template.locales)) {
    locales[locale] = { ...EMPTY_TEMPLATE_LOCALE, ...content };
  }
  return { channel: template.channel, name: template.name, locales };
}

export function draftVariables(
  locales: Record<string, MarketingTemplateLocale>,
): string[] {
  return extractTemplateVariables(
    ...Object.values(locales).flatMap((entry) => [
      entry.subject,
      entry.preheader,
      entry.body,
    ]),
  );
}

/** Only locales with copy are persisted; the server requires `en` among them. */
export function localesForSave(
  locales: Record<string, MarketingTemplateLocale>,
): Record<string, MarketingTemplateLocale> {
  return Object.fromEntries(
    Object.entries(locales).filter(([, entry]) => entry.body.trim()),
  );
}
