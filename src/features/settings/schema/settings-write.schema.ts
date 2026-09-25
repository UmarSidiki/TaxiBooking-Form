import { z } from "zod";

const hexOrRgb = z.string().max(64);

export const settingsWriteSchema = z.object({
  primaryColor: hexOrRgb.optional(),
  secondaryColor: hexOrRgb.optional(),
  borderRadius: z.number().optional(),
  redirectUrl: z.string().optional(),
  thankYouStaySeconds: z.number().optional(),
  redirectImmediatelyAfterBooking: z.boolean().optional(),
  mapInitialLat: z.number().optional(),
  mapInitialLng: z.number().optional(),
  allowedBookingCountries: z.array(z.string().length(2)).optional(),
  mapBounds: z
    .object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    })
    .nullable()
    .optional(),
  mapPolygonPoints: z
    .array(z.object({ lat: z.number(), lng: z.number() }))
    .optional(),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
  stripeCurrency: z.string().optional(),
  stripeTestMode: z.boolean().optional(),
  stripeStatementDescriptor: z.string().optional(),
  stripeSaveCards: z.boolean().optional(),
  multisafepayApiKey: z.string().optional(),
  multisafepayTestMode: z.boolean().optional(),
  acceptedPaymentMethods: z.array(z.string()).optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIBAN: z.string().optional(),
  bankSwiftBIC: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpEncryption: z.enum(["TLS", "SSL", "none"]).optional(),
  smtpTestEmail: z.string().optional(),
  smtpFrom: z.string().optional(),
  smtpSenderName: z.string().optional(),
  enablePartners: z.boolean().optional(),
  enableDrivers: z.boolean().optional(),
  enableAppointmentRequest: z.boolean().optional(),
  enableEmbeddableForm: z.boolean().optional(),
  enableFormBuilder: z.boolean().optional(),
  enableDeskBooking: z.boolean().optional(),
  enableTax: z.boolean().optional(),
  taxPercentage: z.number().optional(),
  taxIncluded: z.boolean().optional(),
  partnerCashSettlement: z.enum(["keep_cash", "operator_margin"]).optional(),
  dispatchAssigneeMode: z.enum(["exclusive", "allow_both"]).optional(),
  defaultPartnerMarginPercentage: z.number().min(0).max(100).optional(),
  adminEmail: z.string().optional(),
  timezone: z.string().optional(),
});
