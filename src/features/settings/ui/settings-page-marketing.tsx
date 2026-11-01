"use client";

import { useTranslations } from "next-intl";

import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { SettingsDeskSave } from "@/features/settings/ui/settings-desk-save";
import { SettingsSection } from "@/features/settings/ui/settings-section";
import { MarketingSenderFields } from "@/features/settings/ui/marketing-sender-fields";
import { MarketingAudienceFields } from "@/features/settings/ui/marketing-audience-fields";
import { MARKETING_CONSENT_TEXT_VERSION } from "@/features/marketing/lib/marketing.constants";

export function SettingsPageMarketing() {
  const t = useTranslations("MarketingSettings");
  const { settings, setSettings } = useSettingsDesk();

  return (
    <div className="flex flex-col gap-6">
      <SettingsDeskSave title={t("title")} help={t("help")} />
      <SettingsSection title={t("sender-title")} description={t("sender-desc")}>
        <MarketingSenderFields settings={settings} setSettings={setSettings} t={t} />
      </SettingsSection>
      <SettingsSection
        title={t("audience-title")}
        description={t("audience-desc")}
      >
        <MarketingAudienceFields
          settings={settings}
          setSettings={setSettings}
          t={t}
        />
      </SettingsSection>
      <SettingsSection
        title={t("consent-version-title")}
        description={t("consent-version-desc")}
      >
        <p className="font-mono text-sm" translate="no">
          {MARKETING_CONSENT_TEXT_VERSION}
        </p>
      </SettingsSection>
    </div>
  );
}
