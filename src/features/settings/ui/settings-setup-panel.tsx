"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { SettingsSection } from "@/features/settings/ui/settings-section";
import AppearanceTab from "@/features/settings/ui/appearance-tab";
import MapTab from "@/features/settings/ui/map-tab";
import { PaymentTabGateway } from "@/features/settings/ui/payment-tab-gateway";
import { PaymentTabStripe } from "@/features/settings/ui/payment-tab-stripe";
import { PaymentTabMultiSafepay } from "@/features/settings/ui/payment-tab-multisafepay";
import { PaymentTabStripeSettings } from "@/features/settings/ui/payment-tab-stripe-settings";
import { PaymentTabBank } from "@/features/settings/ui/payment-tab-bank";
import { PaymentTabInfo } from "@/features/settings/ui/payment-tab-info";
import { SmtpTabFields } from "@/features/settings/ui/smtp-tab-fields";
import type { SettingsDeskPanelsProps } from "@/features/settings/ui/settings-desk-props";

export function SettingsSetupPanel({
  settings,
  patch,
  setSettings,
}: SettingsDeskPanelsProps) {
  const t = useTranslations();
  const [selectedGateway, setSelectedGateway] = useState<"stripe" | "multisafepay">(
    settings.multisafepayApiKey ? "multisafepay" : "stripe"
  );

  return (
    <div className="space-y-6">
      <SettingsSection
        title={t("Dashboard.Settings.theme-and-appearance")}
        description={t("Dashboard.Settings.appearance_scope")}
      >
        <AppearanceTab
          settings={settings}
          handleColorChange={(key, value) => patch(key, value)}
          handleBorderRadiusChange={(value) => patch("borderRadius", value)}
          handleTimezoneChange={(value) => patch("timezone", value)}
        />
      </SettingsSection>
      <SettingsSection title={t("Dashboard.Settings.map")}>
        <MapTab settings={settings} handleMapSettingsChange={patch} />
      </SettingsSection>
      <SettingsSection title={t("Dashboard.Settings.payment-configuration")}>
        <div className="space-y-6">
          <PaymentTabGateway
            t={t}
            selectedGateway={selectedGateway}
            setSelectedGateway={setSelectedGateway}
          />
          <PaymentTabStripe
            settings={settings}
            handleMapSettingsChange={patch}
            t={t}
            selectedGateway={selectedGateway}
          />
          <PaymentTabMultiSafepay
            settings={settings}
            handleMapSettingsChange={patch}
            t={t}
            selectedGateway={selectedGateway}
          />
          <PaymentTabStripeSettings
            settings={settings}
            handleMapSettingsChange={patch}
            t={t}
          />
          <PaymentTabBank
            settings={settings}
            handleMapSettingsChange={patch}
            t={t}
          />
          <PaymentTabInfo t={t} />
        </div>
      </SettingsSection>
      <SettingsSection title={t("Dashboard.Settings.smtp-configuration")}>
        <SmtpTabFields settings={settings} setSettings={setSettings} t={t} />
      </SettingsSection>
    </div>
  );
}
