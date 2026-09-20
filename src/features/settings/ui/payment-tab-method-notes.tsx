"use client";

import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";

export function PaymentTabMethodNotes({
  settings,
  t,
}: Pick<PaymentTabFieldsProps, "settings" | "t">) {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      {!settings.stripePublishableKey && !settings.multisafepayApiKey ? (
        <p role="status">
          {t("Dashboard.Settings.configure-payment-gateway-first")}{" "}
          {t("Dashboard.Settings.select-and-configure-a-payment-gateway-above-to-enable-online-payments")}
        </p>
      ) : null}
      {!settings.stripePublishableKey && settings.multisafepayApiKey ? (
        <p role="status">
          {t("Dashboard.Settings.configure-stripe-first")}{" "}
          {t("Dashboard.Settings.add-your-stripe-api-keys-above-to-enable-card-payments")}
        </p>
      ) : null}
      {settings.stripePublishableKey && !settings.multisafepayApiKey ? (
        <p role="status">
          {t("Dashboard.Settings.configure-multisafepay-first")}{" "}
          {t("Dashboard.Settings.add-your-multisafepay-api-key-above-to-enable-multisafepay-payments")}
        </p>
      ) : null}
    </div>
  );
}
