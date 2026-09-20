"use client";

import { DeskSelect } from "@/features/dashboard/ui/desk-select";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";

export function PaymentTabGateway({
  t,
  selectedGateway,
  setSelectedGateway,
}: Pick<PaymentTabFieldsProps, "t" | "selectedGateway" | "setSelectedGateway">) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {t("Dashboard.Settings.payment-gateway")}
      </label>
      <DeskSelect
        ariaLabel={t("Dashboard.Settings.payment-gateway")}
        value={selectedGateway}
        onValueChange={(value) =>
          setSelectedGateway(value as "stripe" | "multisafepay")
        }
        options={[
          { value: "stripe", label: "Stripe" },
          { value: "multisafepay", label: "MultiSafepay" },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        {t("Dashboard.Settings.select-your-preferred-payment-gateway")}
      </p>
    </div>
  );
}
