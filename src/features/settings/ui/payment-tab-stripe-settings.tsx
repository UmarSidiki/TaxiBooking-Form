"use client";

import { Input } from "@/components/ui/input";
import type { PaymentTabFieldsProps } from "@/components/settings/payment-tab-props";
import { Banknote, Building2, CreditCard } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";


export function PaymentTabStripeSettings({
  settings,
  handleMapSettingsChange,
  t,
}: Pick<PaymentTabFieldsProps, "settings" | "handleMapSettingsChange" | "t">) {
  const { updateCurrency } = useCurrency();
  return (
    <>
        {/* Stripe Settings */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.payment-settings")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.currency")}
              </label>
              <select
                value={settings.stripeCurrency ?? "eur"}
                onChange={(e) => {
                  const newCurrency = e.target.value;
                  updateCurrency(newCurrency);
                  handleMapSettingsChange(
                    "stripeCurrency",
                    newCurrency
                  );
                }}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="eur">
                  {t("Dashboard.Settings.eur-eur-euro")}
                </option>
                <option value="usd">
                  {t("Dashboard.Settings.usd-us-dollar")}
                </option>
                <option value="gbp">
                  {t("Dashboard.Settings.gbp-gbp-british-pound")}
                </option>
                <option value="chf">
                  {t("Dashboard.Settings.chf-fr-swiss-franc")}
                </option>
                <option value="jpy">
                  {t("Dashboard.Settings.jpy-cny-japanese-yen")}
                </option>
                <option value="cad">
                  {t("Dashboard.Settings.cad-canadian-dollar")}
                </option>
                <option value="aud">
                  {t("Dashboard.Settings.aud-australian-dollar")}
                </option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.default-currency-for-payments")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.statement-descriptor-suffix")}
              </label>
              <Input
                type="text"
                placeholder="BOOKING"
                maxLength={22}
                value={settings.stripeStatementDescriptor ?? ""}
                onChange={(e) =>
                  handleMapSettingsChange(
                    "stripeStatementDescriptor",
                    e.target.value
                  )
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t(
                  "Dashboard.Settings.suffix-shown-on-customer-and-apos-s-statement-e-g-and-quot-company-booking-and-quot-max-22-chars"
                )}{" "}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={settings.stripeSaveCards ?? false}
                onChange={(e) =>
                  handleMapSettingsChange(
                    "stripeSaveCards",
                    e.target.checked
                  )
                }
                className="w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium">
                  {t("Dashboard.Settings.allow-customers-to-save-cards")}
                </p>
                <p className="text-xs text-gray-500">
                  {t(
                    "Dashboard.Settings.customers-can-save-cards-for-future-bookings"
                  )}
                </p>
              </div>
            </label>
          </div>
        </div>

    </>
  );
}
