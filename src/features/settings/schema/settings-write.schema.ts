import { z } from "zod";
import { COLOR_PALETTES } from "@/features/settings/lib/color-palettes";

const hexOrRgb = z.string().max(64);

const LOGO_DATA_URL = /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

function isCompanyLogoUrl(value: string) {
  if (value === "") return true;
  if (/\s/.test(value)) return false;
  if (LOGO_DATA_URL.test(value)) return true;
  if (value.startsWith("/")) return !value.startsWith("//") && !value.startsWith("/\\");
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export const companyLogoUrlSchema = z
  .string()
  .trim()
  .max(400_000)
  .refine(isCompanyLogoUrl, { message: "Invalid company logo URL" });

export const settingsWriteSchema = z.object({
  primaryColor: hexOrRgb.optional(),
  secondaryColor: hexOrRgb.optional(),
  borderRadius: z.number().optional(),
  colorPalette: z.enum(COLOR_PALETTES).optional(),
  // Strict #RRGGBB only: these values are turned into CSS on the server.
  customPalette: z
    .object({
      brand: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .strict()
    .optional(),
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
  // "Clear bounds" sends null; it is stored as an empty list (no service area).
  mapPolygonPoints: z
    .array(z.object({ lat: z.number(), lng: z.number() }))
    .nullable()
    .transform((points) => points ?? [])
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
  marketingSenderName: z.string().trim().max(120).optional(),
  marketingSenderEmail: z.string().trim().max(254).optional(),
  marketingReplyTo: z.string().trim().max(254).optional(),
  marketingTestRecipients: z
    .array(
      z
        .string()
        .trim()
        .min(3)
        .max(254)
        .refine(
          (value) =>
            value.includes("@") ||
            value.replace(/[^0-9]/g, "").length >= 6,
          { message: "Invalid test recipient" },
        ),
    )
    .max(100)
    .optional(),
  marketingWhatsappDailyCap: z.number().int().min(1).max(1000).optional(),
  marketingQuietHoursStart: z.number().int().min(0).max(23).optional(),
  marketingQuietHoursEnd: z.number().int().min(0).max(23).optional(),
  marketingTrackOpens: z.boolean().optional(),
  marketingTrackClicks: z.boolean().optional(),
  enablePartners: z.boolean().optional(),
  enableDrivers: z.boolean().optional(),
  enableAppointmentRequest: z.boolean().optional(),
  enableEmbeddableForm: z.boolean().optional(),
  enableFormBuilder: z.boolean().optional(),
  enableDeskBooking: z.boolean().optional(),
  promoCodesEnabled: z.boolean().optional(),
  enableTax: z.boolean().optional(),
  taxPercentage: z.number().optional(),
  taxIncluded: z.boolean().optional(),
  partnerCashSettlement: z.enum(["keep_cash", "operator_margin"]).optional(),
  dispatchAssigneeMode: z.enum(["exclusive", "allow_both"]).optional(),
  defaultPartnerMarginPercentage: z.number().min(0).max(100).optional(),
  adminEmail: z.string().optional(),
  publicBaseUrl: z.string().trim().max(300).optional(),
  timezone: z.string().optional(),
  companyLogoUrl: companyLogoUrlSchema.optional(),
  legalName: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  regNo: z.string().optional(),
  taxRate: z.number().optional(),
  taxInclusive: z.boolean().optional(),
  invoiceFooter: z.string().optional(),
  invoiceTerms: z.string().optional(),
});
