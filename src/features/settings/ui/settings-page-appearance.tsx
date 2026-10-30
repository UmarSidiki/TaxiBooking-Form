"use client";

import { useTranslations } from "next-intl";

import AppearanceTab from "@/features/settings/ui/appearance-tab";
import { AppearancePreview } from "@/features/settings/ui/appearance-preview";
import { AppearanceTimezoneField } from "@/features/settings/ui/appearance-tab-timezone";
import { InvoiceLegalCard } from "@/features/settings/ui/invoice-legal-card";
import { PublicUrlTab } from "@/features/settings/ui/public-url-tab";
import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { SettingsDeskSave } from "@/features/settings/ui/settings-desk-save";
import { SettingsSection } from "@/features/settings/ui/settings-section";

export function SettingsPageAppearance({
  detectedPublicUrl,
}: {
  detectedPublicUrl: string | null;
}) {
  const t = useTranslations();
  const { settings, patch } = useSettingsDesk();

  return (
    <div className="flex flex-col gap-6">
      <SettingsDeskSave
        title={t("Dashboard.Settings.nav_appearance")}
        help={t("Dashboard.Settings.appearance_scope")}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="flex flex-col gap-6">
          <SettingsSection
            title={t("Dashboard.Settings.group-brand")}
            description={t("Dashboard.Settings.group-brand-help")}
          >
            <AppearanceTab
              settings={settings}
              handleColorChange={(key, value) => patch(key, value)}
              handleBorderRadiusChange={(value) => patch("borderRadius", value)}
            />
          </SettingsSection>
          <SettingsSection title={t("Dashboard.Settings.group-region")}>
            <AppearanceTimezoneField
              value={settings.timezone || "Europe/Zurich"}
              onChange={(value) => patch("timezone", value)}
              label={t("Dashboard.Settings.timezone")}
              help={t("Dashboard.Settings.timezone_help")}
            />
          </SettingsSection>
          <SettingsSection title={t("Dashboard.Settings.public-url-title")}>
            <PublicUrlTab
              settings={settings}
              detected={detectedPublicUrl}
              onChange={(value) => patch("publicBaseUrl", value)}
            />
          </SettingsSection>
          <SettingsSection title={t("Dashboard.Settings.invoice-legal")}>
            <InvoiceLegalCard settings={settings} patch={patch} />
          </SettingsSection>
        </div>
        <aside className="self-start xl:sticky xl:top-4 xl:order-none order-first">
          <SettingsSection title={t("Dashboard.Settings.preview-title")}>
            <AppearancePreview settings={settings} />
          </SettingsSection>
        </aside>
      </div>
    </div>
  );
}
