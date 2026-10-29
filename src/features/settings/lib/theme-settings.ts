import { connectDB } from "@/shared/db";
import { Setting, type ISetting } from "@/features/settings/model";
import {
  toPublicSettings,
  type PublicSettings,
} from "@/features/settings/lib/public-settings";
import { isPromoAvailable } from "@/features/pricing/lib/is-promo-available";

export type ThemeSettings = PublicSettings;

function withDefaults(settings: PublicSettings): PublicSettings {
  return {
    ...settings,
    primaryColor: settings.primaryColor || "#B45309",
    secondaryColor: settings.secondaryColor || "#111827",
    borderRadius:
      typeof settings.borderRadius === "number" ? settings.borderRadius : 0.5,
  };
}

export async function getThemeSettings(): Promise<PublicSettings> {
  await connectDB();

  const [settingsDoc, promoAvailable] = await Promise.all([
    Setting.findOne().lean<ISetting>().exec(),
    isPromoAvailable(),
  ]);

  if (!settingsDoc) {
    const created = await Setting.create({});
    return withDefaults({
      ...toPublicSettings(created.toObject() as ISetting),
      promoAvailable,
    });
  }

  return withDefaults({ ...toPublicSettings(settingsDoc), promoAvailable });
}
