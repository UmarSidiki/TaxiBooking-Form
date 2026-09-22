"use client";

import { useTranslations } from "next-intl";

import MapTab from "@/features/settings/ui/map-tab";
import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { SettingsDeskSave } from "@/features/settings/ui/settings-desk-save";
import { SettingsSection } from "@/features/settings/ui/settings-section";

export function SettingsPageMap() {
  const t = useTranslations();
  const { settings, patch } = useSettingsDesk();

  return (
    <div className="flex flex-col gap-6">
      <SettingsDeskSave
        title={t("Dashboard.Settings.nav_map")}
        help={t("Dashboard.Settings.map_help")}
      />
      <SettingsSection title={t("Dashboard.Settings.map-configuration")}>
        <MapTab settings={settings} handleMapSettingsChange={patch} />
      </SettingsSection>
    </div>
  );
}
