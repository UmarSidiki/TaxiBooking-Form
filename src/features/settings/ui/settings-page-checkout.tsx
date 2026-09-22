"use client";

import { Banknote, Building2, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";

import BookingTab from "@/features/settings/ui/booking-tab";
import { FeaturesTabTax } from "@/features/settings/ui/features-tab-tax";
import { PaymentTabCurrency } from "@/features/settings/ui/payment-tab-currency";
import { PaymentTabMethods } from "@/features/settings/ui/payment-tab-methods";
import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { SettingsDeskSave } from "@/features/settings/ui/settings-desk-save";
import { SettingsSection } from "@/features/settings/ui/settings-section";

export function SettingsPageCheckout() {
  const t = useTranslations();
  const featuresT = useTranslations("Dashboard.Features");
  const { settings, patch } = useSettingsDesk();

  const paymentMethods = [
    {
      id: "card",
      label: t("Dashboard.Settings.stripe-payment"),
      Icon: CreditCard,
      description: t("Dashboard.Settings.cards-paypal-apple-pay-google-pay-and-more"),
    },
    {
      id: "multisafepay",
      label: t("Dashboard.Settings.multisafepay"),
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
    <div className="flex flex-col gap-6">
      <SettingsDeskSave
        title={t("Dashboard.Settings.nav_checkout")}
        help={t("Dashboard.Settings.checkout_help")}
      />
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
    </div>
  );
}
