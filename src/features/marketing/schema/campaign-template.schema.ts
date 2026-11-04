import { z } from "zod";
import {
  CUSTOMER_LOCALES,
} from "@/features/customers-admin/schema/customer-list.schema";
import { marketingChannelSchema } from "@/features/marketing/schema/marketing.schema";

export const DEFAULT_TEMPLATE_LOCALE = "en";

export const TEMPLATE_VARIABLES = [
  "firstName",
  "lastRideDate",
  "rideCount",
  "bookingUrl",
  "promoCode",
  "unsubscribeUrl",
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

/** WhatsApp campaigns must always carry this opt-out line. */
export const WHATSAPP_OPT_OUT_LINE = "Reply STOP to unsubscribe";

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function extractTemplateVariables(...texts: string[]): string[] {
  const found = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(VARIABLE_PATTERN)) {
      found.add(match[1]);
    }
  }
  return [...found].sort();
}

export function hasUnsubscribeVariable(text: string): boolean {
  return extractTemplateVariables(text).includes("unsubscribeUrl");
}

export function hasWhatsAppOptOutLine(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes(WHATSAPP_OPT_OUT_LINE.toLowerCase());
}

export const templateLocaleContentSchema = z.object({
  subject: z.string().trim().max(200).default(""),
  preheader: z.string().trim().max(300).default(""),
  body: z.string().trim().min(1).max(20_000),
});

export type TemplateLocaleContent = z.infer<typeof templateLocaleContentSchema>;

export const campaignTemplateWriteSchema = z
  .object({
    channel: marketingChannelSchema,
    name: z.string().trim().min(1).max(120),
    locales: z.record(z.string(), templateLocaleContentSchema),
  })
  .superRefine((value, ctx) => {
    const entries = Object.entries(value.locales);
    if (entries.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locales"],
        message: "locales_required",
      });
      return;
    }

    if (!value.locales[DEFAULT_TEMPLATE_LOCALE]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locales"],
        message: "default_locale_required",
      });
    }

    for (const [locale, content] of entries) {
      if (!(CUSTOMER_LOCALES as readonly string[]).includes(locale)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["locales", locale],
          message: "unknown_locale",
        });
      }
      const used = extractTemplateVariables(
        content.subject,
        content.preheader,
        content.body,
      );
      for (const variable of used) {
        if (!(TEMPLATE_VARIABLES as readonly string[]).includes(variable)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["locales", locale, "body"],
            message: `unknown_variable:${variable}`,
          });
        }
      }

      if (value.channel === "email") {
        if (!content.subject) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["locales", locale, "subject"],
            message: "subject_required",
          });
        }
        if (!hasUnsubscribeVariable(content.body)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["locales", locale, "body"],
            message: "unsubscribe_url_required",
          });
        }
      }

      if (
        value.channel === "whatsapp" &&
        !hasWhatsAppOptOutLine(content.body)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["locales", locale, "body"],
          message: "opt_out_line_required",
        });
      }
    }
  });

export type CampaignTemplateWriteInput = z.infer<
  typeof campaignTemplateWriteSchema
>;

export const campaignTemplateUpdateSchema = campaignTemplateWriteSchema;
