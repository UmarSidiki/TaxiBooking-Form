"use client";

import { useTranslations } from "next-intl";

import AppearanceTab from "@/features/settings/ui/appearance-tab";
import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { SettingsDeskSave } from "@/features/settings/ui/settings-desk-save";
import { SettingsSection } from "@/features/settings/ui/settings-section";

export function SettingsPageAppearance() {
  const t = useTranslations();
  const { settings, patch } = useSettingsDesk();

  return (
    <div className="flex flex-col gap-6">
      <SettingsDeskSave
        title={t("Dashboard.Settings.nav_appearance")}
        help={t("Dashboard.Settings.appearance_scope")}
      />
      <SettingsSection
        title={t("Dashboard.Settings.theme-and-appearance")}
      >
        <AppearanceTab
          settings={settings}
          handleColorChange={(key, value) => patch(key, value)}
          handleBorderRadiusChange={(value) => patch("borderRadius", value)}
          handleTimezoneChange={(value) => patch("timezone", value)}
        />
      </SettingsSection>
    </div>
  );
}
