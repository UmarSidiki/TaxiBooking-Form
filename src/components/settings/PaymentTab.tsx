import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {  Building2, CreditCard, Banknote } from "lucide-react";
import { ISetting } from "@/models/Setting";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PaymentTabProps {
  settings: Partial<ISetting>;
  handleMapSettingsChange: (
    key: keyof ISetting,
    value: string | number | string[] | boolean
  ) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PaymentTab: React.FC<PaymentTabProps> = ({
  settings,
  handleMapSettingsChange,
}) => {
  const t = useTranslations();
  const { updateCurrency } = useCurrency();
  const [selectedGateway, setSelectedGateway] = React.useState<'stripe' | 'multisafepay'>(
    settings.multisafepayApiKey ? 'multisafepay' : 'stripe'
  );

  const paymentMethods = [
    {
      id: "card",
      label: t("Dashboard.Settings.stripe-payment"),
      Icon: CreditCard,
      description: t(
        "Dashboard.Settings.cards-paypal-apple-pay-google-pay-and-more"
      ),
    },
    {
      id: "multisafepay",
      label: "MultiSafepay",
      Icon: CreditCard,
      description: "iDEAL, Bancontact, PayPal & more",
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
    <Card>
      <CardHeader>
        <CardTitle>{t("Dashboard.Settings.payment-configuration")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Gateway Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Dashboard.Settings.payment-gateway")}
            </label>
            <select
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value as 'stripe' | 'multisafepay')}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="stripe">Stripe</option>
              <option value="multisafepay">MultiSafepay</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t("Dashboard.Settings.select-your-preferred-payment-gateway")}
            </p>
          </div>
        </div>

        {/* Stripe Configuration */}
        {selectedGateway === 'stripe' && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {t("Dashboard.Settings.stripe-configuration")}
              </h3>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.stripeTestMode ?? true}
                    onChange={(e) =>
                      handleMapSettingsChange(
                        "stripeTestMode",
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span
                    className={
                      settings.stripeTestMode
                        ? "text-orange-600 font-medium"
                        : "text-green-600 font-medium"
                    }
                  >
                    {settings.stripeTestMode
                      ? t("Dashboard.Settings.test-mode")
                      : t("Dashboard.Settings.live-mode")}
                  </span>
                </label>
              </div>
            </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.publishable-key")}
              </label>
              <Input
                type="text"
                placeholder={
                  settings.stripeTestMode ? "pk_test_..." : "pk_live_..."
                }
                value={settings.stripePublishableKey ?? ""}
                onChange={(e) =>
                  handleMapSettingsChange(
                    "stripePublishableKey",
                    e.target.value
                  )
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.your-stripe")}{" "}
                {settings.stripeTestMode ? "test" : "live"}{" "}
                {t("Dashboard.Settings.publishable-key-starts-with-pk_")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.secret-key")}
              </label>
              <Input
                type="password"
                placeholder={
                  settings.stripeTestMode ? "sk_test_..." : "sk_live_..."
                }
                value={settings.stripeSecretKey ?? ""}
                onChange={(e) =>
                  handleMapSettingsChange(
                    "stripeSecretKey",
                    e.target.value
                  )
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.your-stripe-0")}{" "}
                {settings.stripeTestMode ? "test" : "live"}{" "}
                {t(
                  "Dashboard.Settings.secret-key-starts-with-sk_-keep-this-secure"
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.webhook-secret-optional")}
              </label>
              <Input
                type="password"
                placeholder="whsec_..."
                value={settings.stripeWebhookSecret ?? ""}
                onChange={(e) =>
                  handleMapSettingsChange(
                    "stripeWebhookSecret",
                    e.target.value
                  )
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t(
                  "Dashboard.Settings.webhook-signing-secret-for-secure-payment-status-updates"
                )}{" "}
              </p>
            </div>
          </div>
          </div>
        )}

        {/* MultiSafepay Configuration */}
        {selectedGateway === 'multisafepay' && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">MultiSafepay {t("Dashboard.Settings.configuration")}</h3>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.multisafepayTestMode ?? true}
                    onChange={(e) =>
                      handleMapSettingsChange(
                        "multisafepayTestMode",
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span
                    className={
                      settings.multisafepayTestMode
                        ? "text-orange-600 font-medium"
                        : "text-green-600 font-medium"
                    }
                  >
                    {settings.multisafepayTestMode
                      ? t("Dashboard.Settings.test-mode")
                      : t("Dashboard.Settings.live-mode")}
                  </span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('Dashboard.Settings.api-key')}
                </label>
                <Input
                  type="password"
                  placeholder={t('Dashboard.Settings.your-multisafepay-api-key')}
                  value={settings.multisafepayApiKey ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange(
                      "multisafepayApiKey",
                      e.target.value
                    )
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('Dashboard.Settings.your-multisafepay-api-key-from-the-dashboard')}
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Bank Account Details */}
        {settings.acceptedPaymentMethods?.includes("bank_transfer") && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("Dashboard.Settings.bank-account-details")}{" "}
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              {t(
                "Dashboard.Settings.these-details-will-be-shown-to-customers-who-choose-bank-transfer-payment"
              )}{" "}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("Dashboard.Settings.bank-name")}
                </label>
                <Input
                  type="text"
                  placeholder={t("Dashboard.Settings.ubs-switzerland-ag")}
                  value={settings.bankName ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange("bankName", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("Dashboard.Settings.account-name")}
                </label>
                <Input
                  type="text"
                  placeholder={t("Dashboard.Settings.company-name")}
                  value={settings.bankAccountName ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange(
                      "bankAccountName",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("Dashboard.Settings.account-number")}
                </label>
                <Input
                  type="text"
                  placeholder="123456789"
                  value={settings.bankAccountNumber ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange(
                      "bankAccountNumber",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  IBAN
                </label>
                <Input
                  type="text"
                  placeholder={t(
                    "Dashboard.Settings.ch93-0076-2011-6238-5295-7"
                  )}
                  value={settings.bankIBAN ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange("bankIBAN", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  SWIFT/BIC
                </label>
                <Input
                  type="text"
                  placeholder="UBSWCHZH80A"
                  value={settings.bankSwiftBIC ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange(
                      "bankSwiftBIC",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Info Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong>{" "}
            {t(
              "Dashboard.Settings.to-use-stripe-payments-you-need-to-create-a-stripe-account-at"
            )}{" "}
            <a
              href="https://stripe.com"
              target="_blank"
              rel={t("Dashboard.Settings.noopener-noreferrer")}
              className="underline"
            >
              stripe.com
            </a>{" "}
            {t(
              "Dashboard.Settings.and-get-your-api-keys-from-the-dashboard"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentTab;