"use client";

import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";
import { PaymentWebhookCopy } from "@/features/settings/ui/payment-webhook-copy";


export function PaymentTabMultiSafepay({
  settings,
  handleMapSettingsChange,
  t,
  selectedGateway,
}: Pick<PaymentTabFieldsProps, "settings" | "handleMapSettingsChange" | "t" | "selectedGateway">) {
  return (
    <>
        {/* MultiSafepay Configuration */}
        {selectedGateway === 'multisafepay' && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">MultiSafepay {t("Dashboard.Settings.configuration")}</h3>
              <div className="flex items-center gap-2">
                <label htmlFor="multisafepay-test-mode" className="flex items-center gap-2 text-sm">
                  <Switch
                    id="multisafepay-test-mode"
                    checked={settings.multisafepayTestMode ?? true}
                    onCheckedChange={(checked) =>
                      handleMapSettingsChange("multisafepayTestMode", checked)
                    }
                  />
                  <span
                    className={
                      settings.multisafepayTestMode
                        ? "text-accent-foreground font-medium"
                        : "text-primary font-medium"
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
                <label htmlFor="multisafepay-api-key" className="mb-2 block text-sm font-medium">
                  {t('Dashboard.Settings.api-key')}
                </label>
                <Input
                  id="multisafepay-api-key"
                  name="multisafepay-api-key"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('Dashboard.Settings.your-multisafepay-api-key')}
                  value={settings.multisafepayApiKey ?? ""}
                  onChange={(e) =>
                    handleMapSettingsChange(
                      "multisafepayApiKey",
                      e.target.value
                    )
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Dashboard.Settings.your-multisafepay-api-key-from-the-dashboard')}
                </p>
              </div>
              <div>
                <label htmlFor="multisafepay-webhook-url" className="mb-2 block text-sm font-medium">
                  {t("Dashboard.Settings.webhook-url")}
                </label>
                <div className="flex gap-2">
                  <Input
                    id="multisafepay-webhook-url"
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/multisafepay-webhook` : '/api/multisafepay-webhook'}
                    className="bg-muted text-muted-foreground"
                  />
                  <PaymentWebhookCopy
                    url={typeof window !== "undefined" ? `${window.location.origin}/api/multisafepay-webhook` : "/api/multisafepay-webhook"}
                    t={t}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("Dashboard.Settings.add-this-url-in-multisafepay-dashboard")}
                </p>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
