"use client";

import { Switch } from "@/shared/ui/switch";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";
import type { LucideIcon } from "lucide-react";
import { PaymentTabMethodNotes } from "@/features/settings/ui/payment-tab-method-notes";

export function PaymentTabMethods({
  settings,
  handleMapSettingsChange,
  t,
  paymentMethods,
}: Pick<PaymentTabFieldsProps, "settings" | "handleMapSettingsChange" | "t"> & {
  paymentMethods: Array<{
    id: string;
    label: string;
    Icon: LucideIcon;
    description: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => {
        const locked =
          (method.id === "card" && !settings.stripePublishableKey) ||
          (method.id === "multisafepay" && !settings.multisafepayApiKey);
        const checked = settings.acceptedPaymentMethods?.includes(method.id) ?? false;
        return (
          <div
            key={method.id}
            className="flex items-start gap-3 rounded-md border border-border p-4"
          >
            <Switch
              aria-label={method.label}
              checked={checked}
              disabled={locked}
              onCheckedChange={(on) => {
                if (locked) return;
                const current = settings.acceptedPaymentMethods || [];
                const updated = on
                  ? [...current, method.id]
                  : current.filter((id) => id !== method.id);
                handleMapSettingsChange("acceptedPaymentMethods", updated);
              }}
            />
            <method.Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{method.label}</p>
              <p className="text-xs text-muted-foreground">{method.description}</p>
            </div>
          </div>
        );
      })}
      <PaymentTabMethodNotes settings={settings} t={t} />
    </div>
  );
}
