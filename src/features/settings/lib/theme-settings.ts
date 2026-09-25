import { connectDB } from "@/shared/db";
import { Setting, type ISetting } from "@/features/settings/model";
import {
  toPublicSettings,
  type PublicSettings,
} from "@/features/settings/lib/public-settings";

export type ThemeSettings = PublicSettings;

function withDefaults(settings: PublicSettings): PublicSettings {
  return {
    ...settings,
    primaryColor: settings.primaryColor || "#EAB308",
    secondaryColor: settings.secondaryColor || "#111827",
    borderRadius:
      typeof settings.borderRadius === "number" ? settings.borderRadius : 0.5,
  };
}

export async function getThemeSettings(): Promise<PublicSettings> {
  await connectDB();

  const settingsDoc = await Setting.findOne().lean<ISetting>().exec();

  if (!settingsDoc) {
    const created = await Setting.create({});
    return withDefaults(toPublicSettings(created.toObject() as ISetting));
  }

  return withDefaults(toPublicSettings(settingsDoc));
}
