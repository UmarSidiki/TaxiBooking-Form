"use client";

import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";

export function PaymentTabStripeSettings({
  settings,
  handleMapSettingsChange,
  t,
}: Pick<PaymentTabFieldsProps, "settings" | "handleMapSettingsChange" | "t">) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="stripe-statement-descriptor" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Settings.statement-descriptor-suffix")}
        </label>
        <Input
          id="stripe-statement-descriptor"
          name="stripe-statement-descriptor"
          type="text"
          className="h-11"
          placeholder="BOOKING"
          maxLength={22}
          value={settings.stripeStatementDescriptor ?? ""}
          onChange={(e) =>
            handleMapSettingsChange("stripeStatementDescriptor", e.target.value)
          }
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t(
            "Dashboard.Settings.suffix-shown-on-customer-and-apos-s-statement-e-g-and-quot-company-booking-and-quot-max-22-chars"
          )}
        </p>
      </div>
      <div className="flex items-start gap-4 rounded-md border border-border p-3">
        <Switch
          id="stripeSaveCards"
          checked={settings.stripeSaveCards ?? false}
          onCheckedChange={(checked) =>
            handleMapSettingsChange("stripeSaveCards", checked)
          }
        />
        <div>
          <label htmlFor="stripeSaveCards" className="text-sm font-medium">
            {t("Dashboard.Settings.allow-customers-to-save-cards")}
          </label>
          <p className="text-xs text-muted-foreground">
            {t("Dashboard.Settings.customers-can-save-cards-for-future-bookings")}
          </p>
        </div>
      </div>
    </div>
  );
}
