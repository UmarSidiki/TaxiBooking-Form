"use client";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";


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
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Dashboard.Settings.your-multisafepay-api-key-from-the-dashboard')}
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
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/multisafepay-webhook` : '/api/multisafepay-webhook'}
                    className="bg-muted text-muted-foreground"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 whitespace-nowrap"
                    onClick={() => {
                      const webhookUrl = typeof window !== 'undefined' 
                        ? `${window.location.origin}/api/multisafepay-webhook` 
                        : '/api/multisafepay-webhook';
                      navigator.clipboard.writeText(webhookUrl);
                    }}
                  >
                    {t("Dashboard.Settings.copy")}
                  </Button>
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
