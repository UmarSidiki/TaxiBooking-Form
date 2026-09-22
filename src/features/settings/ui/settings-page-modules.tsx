"use client";

import { useTranslations } from "next-intl";

import FeaturesTab from "@/features/settings/ui/features-tab";
import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { SettingsDeskSave } from "@/features/settings/ui/settings-desk-save";
import { SettingsSection } from "@/features/settings/ui/settings-section";

export function SettingsPageModules() {
  const t = useTranslations();
  const { settings, patch } = useSettingsDesk();

  return (
    <div className="flex flex-col gap-6">
      <SettingsDeskSave
        title={t("Dashboard.Settings.nav_modules")}
        help={t("Dashboard.Settings.modules_help")}
      />
      <SettingsSection
        title={t("Dashboard.Features.module-management")}
        description={t("Dashboard.Features.enable-or-disable-specific-modules")}
      >
        <FeaturesTab settings={settings} onSettingsChange={patch} />
      </SettingsSection>
    </div>
  );
}
