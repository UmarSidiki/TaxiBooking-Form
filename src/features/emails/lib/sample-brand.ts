import type { EmailBrand } from "@/features/emails/types";
import { resolveBrandColors } from "@/features/settings/lib/brand-colors";

export const sampleBrand: EmailBrand = {
  name: "Swiss Transfers",
  logoUrl: null,
  accent: resolveBrandColors(null).primary,
  address: "Bahnhofstrasse 1, 8001 Zürich",
  phone: "+41 44 000 00 00",
  supportEmail: "support@example.com",
  websiteUrl: "https://example.com",
};
