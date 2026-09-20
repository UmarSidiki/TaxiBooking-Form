"use client";

import { Input } from "@/shared/ui/input";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";
import { Banknote, Building2, CreditCard } from "lucide-react";
import { useCurrency } from "@/shared/context/currency-context";


export function PaymentTabStripe({
  settings,
  handleMapSettingsChange,
  t,
  selectedGateway,
}: Pick<PaymentTabFieldsProps, "settings" | "handleMapSettingsChange" | "t" | "selectedGateway">) {
  return (
    <>
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
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.webhook-url")}
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/stripe-webhook` : '/api/stripe-webhook'}
                  className="bg-gray-50 text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    const webhookUrl = typeof window !== 'undefined' 
                      ? `${window.location.origin}/api/stripe-webhook` 
                      : '/api/stripe-webhook';
                    navigator.clipboard.writeText(webhookUrl);
                  }}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm whitespace-nowrap"
                >
                  {t("Dashboard.Settings.copy")}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.add-this-url-in-stripe-dashboard-webhooks")}
              </p>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-800 mb-2">
                  {t("Dashboard.Settings.stripe-webhook-events-heading")}
                </p>
                <ul className="space-y-1 font-mono text-xs text-slate-700">
                  <li>payment_intent.succeeded</li>
                  <li>payment_intent.payment_failed</li>
                  <li>charge.refunded</li>
                </ul>
                <p className="text-xs text-slate-500 mt-2">
                  {t("Dashboard.Settings.stripe-webhook-events-help")}
                </p>
              </div>
            </div>
          </div>
          </div>
        )}

    </>
  );
}
