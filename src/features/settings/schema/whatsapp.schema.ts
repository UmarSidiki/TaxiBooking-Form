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
  "plate",
  "driver",
  "total",
  "currency",
  "passengers",
  "companyPhone",
  "portal",
  "portalUrl",
  "statusUrl",
  "payUrl",
  "reviewUrl",
  "invoiceNumber",
  "documents",
  "reason",
] as const;

export const whatsappConfigWriteSchema = z.object({
  enabled: z.boolean(),
  defaultCallingCode: z.string().regex(/^\d{0,4}$/),
  notifyNumbers: z.array(z.string().trim().min(1).max(32)).max(5),
  companyPhone: z.string().trim().max(32),
  defaultLocale: z.enum(whatsappLocales),
  quietHours: z
    .object({
      enabled: z.boolean(),
      startHour: z.number().int().min(0).max(23),
      endHour: z.number().int().min(0).max(23),
    })
    .optional(),
  requireOptIn: z.boolean().optional(),
});

export const customerWhatsAppEvents = [
  "booking_confirmed",
  "driver_assigned",
  "on_the_way",
  "arrived",
  "completed",
  "booking_cancelled",
  "booking_changed",
  "request_received",
  "request_declined",
  "quote_pay_link",
  "thank_you",
  "customer_pickup_reminder",
  "invoice_notice",
  "sign_in_otp",
] as const;

export const whatsappTemplateWriteSchema = z.object({
  audience: z.enum(["customer", "desk"]),
  locale: z.enum(whatsappLocales),
  body: z.string().trim().min(1).max(1000),
  enabled: z.boolean(),
  event: z.enum(customerWhatsAppEvents).default("booking_confirmed"),
});

export const whatsappTestSendSchema = z.object({
  templateId: z.string().min(1),
  to: z.string().trim().min(7).max(32),
});

export type WhatsAppConfigWrite = z.infer<typeof whatsappConfigWriteSchema>;
export type WhatsAppTemplateWrite = z.infer<typeof whatsappTemplateWriteSchema>;
