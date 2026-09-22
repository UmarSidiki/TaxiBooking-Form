"use client";

import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";
import { PaymentWebhookCopy } from "@/features/settings/ui/payment-webhook-copy";


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
                <label htmlFor="stripe-test-mode" className="flex items-center gap-2 text-sm">
                  <Switch
                    id="stripe-test-mode"
                    checked={settings.stripeTestMode ?? true}
                    onCheckedChange={(checked) =>
                      handleMapSettingsChange("stripeTestMode", checked)
                    }
                  />
                  <span
                    className={
                      settings.stripeTestMode
                        ? "text-accent-foreground font-medium"
                        : "text-primary font-medium"
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
              <label htmlFor="stripe-publishable-key" className="mb-2 block text-sm font-medium">
                {t("Dashboard.Settings.publishable-key")}
              </label>
              <Input
                id="stripe-publishable-key"
                name="stripe-publishable-key"
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
              <p className="text-xs text-muted-foreground mt-1">
                {t("Dashboard.Settings.your-stripe")}{" "}
                {settings.stripeTestMode ? "test" : "live"}{" "}
                {t("Dashboard.Settings.publishable-key-starts-with-pk_")}
              </p>
            </div>
            <div>
              <label htmlFor="stripe-secret-key" className="mb-2 block text-sm font-medium">
                {t("Dashboard.Settings.secret-key")}
              </label>
              <Input
                id="stripe-secret-key"
                name="stripe-secret-key"
                type="password"
                autoComplete="new-password"
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
              <p className="text-xs text-muted-foreground mt-1">
                {t("Dashboard.Settings.your-stripe-0")}{" "}
                {settings.stripeTestMode ? "test" : "live"}{" "}
                {t(
                  "Dashboard.Settings.secret-key-starts-with-sk_-keep-this-secure"
                )}
              </p>
            </div>
            <div>
              <label htmlFor="stripe-webhook-secret" className="mb-2 block text-sm font-medium">
                {t("Dashboard.Settings.webhook-secret-optional")}
              </label>
              <Input
                id="stripe-webhook-secret"
                name="stripe-webhook-secret"
                type="password"
                autoComplete="new-password"
                placeholder="whsec_..."
                value={settings.stripeWebhookSecret ?? ""}
                onChange={(e) =>
                  handleMapSettingsChange(
                    "stripeWebhookSecret",
                    e.target.value
                  )
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "Dashboard.Settings.webhook-signing-secret-for-secure-payment-status-updates"
                )}{" "}
              </p>
            </div>
            <div>
              <label htmlFor="stripe-webhook-url" className="mb-2 block text-sm font-medium">
                {t("Dashboard.Settings.webhook-url")}
              </label>
              <div className="flex gap-2">
                <Input
                  id="stripe-webhook-url"
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/stripe-webhook` : '/api/stripe-webhook'}
                  className="bg-muted text-muted-foreground"
                />
                <PaymentWebhookCopy
                  url={typeof window !== "undefined" ? `${window.location.origin}/api/stripe-webhook` : "/api/stripe-webhook"}
                  t={t}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Dashboard.Settings.add-this-url-in-stripe-dashboard-webhooks")}
              </p>
              <div className="mt-3 rounded-lg border border-border bg-muted p-3">
                <p className="text-xs font-medium text-foreground mb-2">
                  {t("Dashboard.Settings.stripe-webhook-events-heading")}
                </p>
                <ul className="space-y-1 font-mono text-xs text-foreground">
                  <li>payment_intent.succeeded</li>
                  <li>payment_intent.payment_failed</li>
                  <li>charge.refunded</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
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
