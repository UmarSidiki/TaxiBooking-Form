import { z } from "zod";

export const whatsappLocales = ["en", "fr", "es", "de", "nl", "it", "ru", "ar"] as const;

export const whatsappVariables = [
  "name",
  "tripId",
  "pickup",
  "dropoff",
  "date",
  "time",
  "vehicle",
  "total",
  "passengers",
  "companyPhone",
] as const;

export const whatsappConfigWriteSchema = z.object({
  enabled: z.boolean(),
  defaultCallingCode: z.string().regex(/^\d{0,4}$/),
  notifyNumbers: z.array(z.string().trim().min(1).max(32)).max(5),
  companyPhone: z.string().trim().max(32),
  defaultLocale: z.enum(whatsappLocales),
});

export const whatsappTemplateWriteSchema = z.object({
  audience: z.enum(["customer", "desk"]),
  locale: z.enum(whatsappLocales),
  body: z.string().trim().min(1).max(1000),
  enabled: z.boolean(),
});

export const whatsappTestSendSchema = z.object({
  templateId: z.string().min(1),
  to: z.string().trim().min(7).max(32),
});

export type WhatsAppConfigWrite = z.infer<typeof whatsappConfigWriteSchema>;
export type WhatsAppTemplateWrite = z.infer<typeof whatsappTemplateWriteSchema>;
