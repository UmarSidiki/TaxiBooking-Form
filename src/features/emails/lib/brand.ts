import { brandName } from "@/features/settings/lib/brand-name";
import { connectDB } from "@/shared/db";
import { Setting, WhatsAppConfig } from "@/features/settings/model";
import type { ISetting } from "@/features/settings/model";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import type { EmailBrand } from "@/features/emails/types";
import { resolveBrandColors } from "@/features/settings/lib/brand-colors";

function clean(value?: string | null) {
  return (value ?? "").trim();
}

export function brandFromSettings(
  settings: Partial<ISetting> | null,
  companyPhone?: string | null,
  websiteUrl?: string | null,
): EmailBrand {
  const name = brandName(settings) || "Booking";
  return {
    name,
    logoUrl: clean(settings?.companyLogoUrl) || null,
    accent: resolveBrandColors(settings).primary,
    address: clean(settings?.companyAddress),
    phone:
      clean(settings?.companyPhone) ||
      clean(companyPhone) ||
      clean(process.env.NEXT_PUBLIC_PHONE_NUMBER),
    supportEmail:
      clean(settings?.adminEmail) ||
      clean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
    websiteUrl: clean(websiteUrl) || null,
  };
}

export async function loadEmailBrand(): Promise<EmailBrand> {
  await connectDB();
  const [settings, config, websiteUrl] = await Promise.all([
    Setting.findOne().lean<ISetting>(),
    WhatsAppConfig.findOne().select("companyPhone").lean<{ companyPhone?: string }>(),
    resolvePublicUrl().catch(() => null),
  ]);
  return brandFromSettings(settings, config?.companyPhone, websiteUrl);
}

