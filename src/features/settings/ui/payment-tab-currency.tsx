"use client";

import { useCurrency } from "@/shared/context/currency-context";
import { DeskSelect } from "@/features/dashboard/ui/desk-select";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";

const CURRENCIES = [
  { value: "eur", key: "Dashboard.Settings.eur-eur-euro" },
  { value: "usd", key: "Dashboard.Settings.usd-us-dollar" },
  { value: "gbp", key: "Dashboard.Settings.gbp-gbp-british-pound" },
  { value: "chf", key: "Dashboard.Settings.chf-fr-swiss-franc" },
  { value: "jpy", key: "Dashboard.Settings.jpy-cny-japanese-yen" },
  { value: "cad", key: "Dashboard.Settings.cad-canadian-dollar" },
  { value: "aud", key: "Dashboard.Settings.aud-australian-dollar" },
] as const;

export function PaymentTabCurrency({
  settings,
  handleMapSettingsChange,
  t,
}: Pick<PaymentTabFieldsProps, "settings" | "handleMapSettingsChange" | "t">) {
  const { updateCurrency } = useCurrency();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {t("Dashboard.Settings.currency")}
      </label>
      <DeskSelect
        ariaLabel={t("Dashboard.Settings.currency")}
        value={settings.stripeCurrency ?? "eur"}
        onValueChange={(newCurrency) => {
          updateCurrency(newCurrency);
          handleMapSettingsChange("stripeCurrency", newCurrency);
        }}
        options={CURRENCIES.map((item) => ({
          value: item.value,
          label: t(item.key),
        }))}
      />
      <p className="text-xs text-muted-foreground">
        {t("Dashboard.Settings.default-currency-for-payments")}
      </p>
    </div>
  );
}
