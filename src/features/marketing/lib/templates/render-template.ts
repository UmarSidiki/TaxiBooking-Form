import {
  extractTemplateVariables,
  type TemplateLocaleContent,
} from "@/features/marketing/schema/campaign-template.schema";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";
import {
  missingTemplateVariables,
  type TemplateVariableValues,
} from "@/features/marketing/lib/templates/template-variables";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/** Every interpolated value is untrusted customer data. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

function substitute(
  text: string,
  values: TemplateVariableValues,
  escape: boolean,
): string {
  return text.replace(VARIABLE_PATTERN, (_match, name: string) => {
    const value = values[name as keyof TemplateVariableValues] ?? "";
    return escape ? escapeHtml(value) : value;
  });
}

function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type RenderedTemplate = {
  channel: MarketingChannel;
  locale: string;
  fallbackUsed: boolean;
  subject: string;
  preheader: string;
  body: string;
  text: string;
  usedVariables: string[];
  missingVariables: string[];
};

export type TemplateLocaleMap = Record<string, TemplateLocaleContent>;

/**
 * Pure renderer. The template body is trusted HTML (limited rich text); the
 * substituted customer values are escaped. WhatsApp bodies are plain text.
 */
export function renderCampaignTemplate(input: {
  channel: MarketingChannel;
  locales: TemplateLocaleMap;
  locale: string;
  fallbackLocale: string;
  values: TemplateVariableValues;
}): RenderedTemplate | null {
  const content =
    input.locales[input.locale] ??
    input.locales[input.fallbackLocale] ??
    Object.values(input.locales)[0];
  if (!content) return null;

  const fallbackUsed = !input.locales[input.locale];
  const isEmail = input.channel === "email";

  const subject = substitute(content.subject, input.values, false)
    .replace(/[\r\n]+/g, " ")
    .trim();
  const preheader = substitute(content.preheader, input.values, false)
    .replace(/[\r\n]+/g, " ")
    .trim();
  const body = substitute(content.body, input.values, isEmail);
  const text = isEmail ? plainText(body) : body.trim();

  const usedVariables = extractTemplateVariables(
    content.subject,
    content.preheader,
    content.body,
  );

  return {
    channel: input.channel,
    locale: input.locales[input.locale] ? input.locale : input.fallbackLocale,
    fallbackUsed,
    subject,
    preheader,
    body,
    text,
    usedVariables,
    missingVariables: missingTemplateVariables(usedVariables, input.values),
  };
}
