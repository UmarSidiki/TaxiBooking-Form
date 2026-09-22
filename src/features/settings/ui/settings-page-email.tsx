"use client";

import { useTranslations } from "next-intl";

import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { SettingsDeskSave } from "@/features/settings/ui/settings-desk-save";
import { SettingsSection } from "@/features/settings/ui/settings-section";
import { SmtpTabFields } from "@/features/settings/ui/smtp-tab-fields";
import { SmtpTabTest } from "@/features/settings/ui/smtp-tab-test";

export function SettingsPageEmail() {
  const t = useTranslations();
  const { settings, setSettings } = useSettingsDesk();

  return (
    <div className="flex flex-col gap-6">
      <SettingsDeskSave
        title={t("Dashboard.Settings.nav_email")}
        help={t("Dashboard.Settings.email_help")}
      />
      <SettingsSection title={t("Dashboard.Settings.smtp-configuration")}>
        <SmtpTabFields settings={settings} setSettings={setSettings} t={t} />
      </SettingsSection>
      <SettingsSection title={t("Dashboard.Settings.testing")}>
        <SmtpTabTest
          settings={settings}
          setSettings={setSettings}
          t={t}
        />
      </SettingsSection>
    </div>
  );
}
