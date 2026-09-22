"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { PaymentTabBank } from "@/features/settings/ui/payment-tab-bank";
import { PaymentTabGateway } from "@/features/settings/ui/payment-tab-gateway";
import { PaymentTabInfo } from "@/features/settings/ui/payment-tab-info";
import { PaymentTabMultiSafepay } from "@/features/settings/ui/payment-tab-multisafepay";
import { PaymentTabStripe } from "@/features/settings/ui/payment-tab-stripe";
import { PaymentTabStripeSettings } from "@/features/settings/ui/payment-tab-stripe-settings";
import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { SettingsDeskSave } from "@/features/settings/ui/settings-desk-save";
import { SettingsSection } from "@/features/settings/ui/settings-section";

export function SettingsPageGateways() {
  const t = useTranslations();
  const { settings, patch } = useSettingsDesk();
  const [selectedGateway, setSelectedGateway] = useState<"stripe" | "multisafepay">(
    settings.multisafepayApiKey ? "multisafepay" : "stripe"
  );

  return (
    <div className="flex flex-col gap-6">
      <SettingsDeskSave
        title={t("Dashboard.Settings.nav_gateways")}
        help={t("Dashboard.Settings.gateways_help")}
      />
      <SettingsSection title={t("Dashboard.Settings.payment-configuration")}>
        <div className="flex flex-col gap-6">
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
    </div>
  );
}
