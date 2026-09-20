"use client";

import { Input } from "@/shared/ui/input";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";
import { Banknote, Building2, CreditCard } from "lucide-react";
import { useCurrency } from "@/shared/context/currency-context";


export function PaymentTabMethods({
  settings,
  handleMapSettingsChange,
  t,
  paymentMethods,
}: Pick<PaymentTabFieldsProps, "settings" | "handleMapSettingsChange" | "t"> & {
  paymentMethods: Array<{
    id: string;
    label: string;
    Icon: typeof CreditCard;
    description: string;
  }>;
}) {
  return (
    <>
        {/* Payment Methods */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.accepted-payment-methods")}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  settings.acceptedPaymentMethods?.includes(method.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                } ${
                  (method.id === "card" && !settings.stripePublishableKey) ||
                  (method.id === "multisafepay" && !settings.multisafepayApiKey)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    settings.acceptedPaymentMethods?.includes(
                      method.id
                    ) ?? false
                  }
                  onChange={(e) => {
                    if (
                      method.id === "card" &&
                      !settings.stripePublishableKey
                    ) {
                      alert(
                        t(
                          "Dashboard.Settings.please-configure-stripe-settings-first-before-enabling-card-payments"
                        )
                      );
                      return;
                    }
                    if (
                      method.id === "multisafepay" &&
                      !settings.multisafepayApiKey
                    ) {
                      alert(
                        t(
                          "Dashboard.Settings.please-configure-multisafepay-settings-first"
                        )
                      );
                      return;
                    }
                    const current = settings.acceptedPaymentMethods || [];
                    const updated = e.target.checked
                      ? [...current, method.id]
                      : current.filter((m) => m !== method.id);
                    handleMapSettingsChange(
                      "acceptedPaymentMethods",
                      updated
                    );
                  }}
                  disabled={
                    (method.id === "card" && !settings.stripePublishableKey) ||
                    (method.id === "multisafepay" && !settings.multisafepayApiKey)
                  }
                  className="w-4 h-4 mt-0.5"
                />
                <method.Icon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {method.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {method.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className="space-y-2">
            {!settings.stripePublishableKey && !settings.multisafepayApiKey && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  ⚠️{" "}
                  <strong>
                    {t("Dashboard.Settings.configure-payment-gateway-first")}
                  </strong>{" "}
                  {t(
                    "Dashboard.Settings.select-and-configure-a-payment-gateway-above-to-enable-online-payments"
                  )}
                </p>
              </div>
            )}
            {!settings.stripePublishableKey && settings.multisafepayApiKey && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  ⚠️{" "}
                  <strong>
                    {t("Dashboard.Settings.configure-stripe-first")}
                  </strong>{" "}
                  {t(
                    "Dashboard.Settings.add-your-stripe-api-keys-above-to-enable-card-payments"
                  )}
                </p>
              </div>
            )}
            {settings.stripePublishableKey && !settings.multisafepayApiKey && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  ⚠️{" "}
                  <strong>
                    {t("Dashboard.Settings.configure-multisafepay-first")}
                  </strong>{" "}
                  {t(
                    "Dashboard.Settings.add-your-multisafepay-api-key-above-to-enable-multisafepay-payments"
                  )}
                </p>
              </div>
            )}
            {settings.stripePublishableKey && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>
                    {t("Dashboard.Settings.stripe-payment-includes")}
                  </strong>
                  <br />
                  {t(
                    "Dashboard.Settings.credit-debit-cards-visa-mastercard-amex-etc"
                  )}
                  <br />
                  {t(
                    "Dashboard.Settings.paypal-if-enabled-in-your-stripe-account"
                  )}
                  <br />
                  {t(
                    "Dashboard.Settings.apple-pay-and-google-pay-shown-automatically-on-supported-devices"
                  )}
                  <br />
                  {t(
                    "Dashboard.Settings.buy-now-pay-later-options-klarna-affirm-afterpay-based-on-region"
                  )}
                  <br />
                  {t(
                    "Dashboard.Settings.cash-app-link-and-more-payment-methods"
                  )}
                  <br />
                  <br />
                  <em>
                    {t(
                      "Dashboard.Settings.available-methods-depend-on-your-stripe-account-settings-and-customer-location"
                    )}
                  </em>
                </p>
              </div>
            )}
            {settings.multisafepayApiKey && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-800">
                  <strong>
                    {t("Dashboard.Settings.multisafepay-payment-includes")}
                  </strong>
                  <br />
                  {t(
                    "Dashboard.Settings.ideal-netherlands"
                  )}
                  <br />
                  {t(
                    "Dashboard.Settings.bancontact-belgium"
                  )}
                  <br />
                  {t(
                    "Dashboard.Settings.paypal-and-credit-debit-cards"
                  )}
                  <br />
                  {t(
                    "Dashboard.Settings.sofort-giropay-and-more-european-payment-methods"
                  )}
                  <br />
                  <br />
                  <em>
                    {t(
                      "Dashboard.Settings.available-methods-depend-on-your-multisafepay-account-settings"
                    )}
                  </em>
                </p>
              </div>
            )}
          </div>
        </div>

    </>
  );
}
