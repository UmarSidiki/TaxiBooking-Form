"use client";

import { useTranslations } from "next-intl";

import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { SettingsDeskSave } from "@/features/settings/ui/settings-desk-save";
import { SettingsSection } from "@/features/settings/ui/settings-section";
import { MarketingSenderFields } from "@/features/settings/ui/marketing-sender-fields";
import {
  MARKETING_CONSENT_TEXT_VERSION,
  MARKETING_OPEN_CLICK_TRACKING,
  MARKETING_QUIET_HOURS,
  WHATSAPP_MARKETING_DAILY_CAP,
} from "@/features/marketing/lib/marketing.constants";

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
        title={t("consent-version-title")}
        description={t("consent-version-desc")}
      >
        <p className="font-mono text-sm" translate="no">
          {MARKETING_CONSENT_TEXT_VERSION}
        </p>
      </SettingsSection>
      <SettingsSection
        title={t("limits-title")}
        description={t("limits-desc", {
          cap: WHATSAPP_MARKETING_DAILY_CAP,
          start: `${String(MARKETING_QUIET_HOURS.startHour).padStart(2, "0")}:00`,
          end: `${String(MARKETING_QUIET_HOURS.endHour).padStart(2, "0")}:00`,
          tracking: MARKETING_OPEN_CLICK_TRACKING ? t("on") : t("off"),
        })}
      >
        {null}
      </SettingsSection>
    </div>
  );
}
