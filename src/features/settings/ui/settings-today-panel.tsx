"use client";

import { Building2, CreditCard, Banknote } from "lucide-react";
import { useTranslations } from "next-intl";

import { SettingsSection } from "@/features/settings/ui/settings-section";
import { PaymentTabMethods } from "@/features/settings/ui/payment-tab-methods";
import { PaymentTabCurrency } from "@/features/settings/ui/payment-tab-currency";
import { FeaturesTabTax } from "@/features/settings/ui/features-tab-tax";
import BookingTab from "@/features/settings/ui/booking-tab";
import FeaturesTab from "@/features/settings/ui/features-tab";
import { SmtpTabTest } from "@/features/settings/ui/smtp-tab-test";
import type { SettingsDeskPanelsProps } from "@/features/settings/ui/settings-desk-props";

export function SettingsTodayPanel({
  settings,
  patch,
  setSettings,
  isLoading,
  setIsLoading,
}: SettingsDeskPanelsProps) {
  const t = useTranslations();
  const featuresT = useTranslations("Dashboard.Features");

  const paymentMethods = [
    {
      id: "card",
      label: t("Dashboard.Settings.stripe-payment"),
      Icon: CreditCard,
      description: t("Dashboard.Settings.cards-paypal-apple-pay-google-pay-and-more"),
    },
    {
      id: "multisafepay",
      label: "MultiSafepay",
      Icon: CreditCard,
      description: t("Dashboard.Settings.multisafepay-methods-desc"),
    },
    {
      id: "cash",
      label: t("Dashboard.Settings.cash-payment"),
      Icon: Banknote,
      description: t("Dashboard.Settings.pay-with-cash-on-delivery"),
    },
    {
      id: "bank_transfer",
      label: t("Dashboard.Settings.bank-transfer"),
      Icon: Building2,
      description: t("Dashboard.Settings.direct-bank-transfer"),
    },
  ];

  return (
    <div className="space-y-6">
      <SettingsSection title={t("Dashboard.Settings.accepted-payment-methods")}>
        <PaymentTabMethods
          settings={settings}
          handleMapSettingsChange={patch}
          t={t}
          paymentMethods={paymentMethods}
        />
      </SettingsSection>
      <SettingsSection title={t("Dashboard.Features.tax-module")}>
        <FeaturesTabTax
          settings={settings}
          t={featuresT}
          onEnable={(checked) => patch("enableTax", checked)}
          onPercentage={(value) => patch("taxPercentage", value)}
          onIncluded={(checked) => patch("taxIncluded", checked)}
        />
      </SettingsSection>
      <SettingsSection title={t("Dashboard.Settings.currency")}>
        <PaymentTabCurrency
          settings={settings}
          handleMapSettingsChange={patch}
          t={t}
        />
      </SettingsSection>
      <SettingsSection title={t("Dashboard.Settings.booking-settings")}>
        <BookingTab settings={settings} handleMapSettingsChange={patch} />
      </SettingsSection>
      <SettingsSection
        title={t("Dashboard.Features.module-management")}
        description={t("Dashboard.Features.enable-or-disable-specific-modules")}
      >
        <FeaturesTab settings={settings} onSettingsChange={patch} />
      </SettingsSection>
      <SettingsSection title={t("Dashboard.Settings.testing")}>
        <SmtpTabTest
          settings={settings}
          setSettings={setSettings}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          t={t}
        />
      </SettingsSection>
    </div>
  );
}
