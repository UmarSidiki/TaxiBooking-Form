import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";
import type { ISetting } from "@/models/Setting";

export type ThemeSettings = Pick<ISetting, "primaryColor" | "secondaryColor" | "borderRadius"> &
  Partial<Omit<ISetting, "primaryColor" | "secondaryColor" | "borderRadius">>;

function ensureDefaults(settings: Partial<ISetting> | null): ThemeSettings {
  const defaults = {
    primaryColor: "#EAB308",
    secondaryColor: "#111827",
    borderRadius: 0.5,
  };

  if (!settings) {
    return defaults;
  }

  return {
    ...settings,
    primaryColor: settings.primaryColor || defaults.primaryColor,
    secondaryColor: settings.secondaryColor || defaults.secondaryColor,
    borderRadius:
      typeof settings.borderRadius === "number"
        ? settings.borderRadius
        : defaults.borderRadius,
  } as ThemeSettings;
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  await connectDB();

  const settingsDoc = await Setting.findOne({}).lean<ISetting>().exec();

  if (!settingsDoc) {
    const created = await Setting.create({});
    return ensureDefaults(created.toObject());
  }

  return ensureDefaults(settingsDoc);
}
