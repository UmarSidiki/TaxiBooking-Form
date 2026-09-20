"use client";

import { Input } from "@/shared/ui/input";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";
import { Banknote, Building2, CreditCard } from "lucide-react";
import { useCurrency } from "@/shared/context/currency-context";


export function PaymentTabGateway({
  t,
  selectedGateway,
  setSelectedGateway,
}: Pick<PaymentTabFieldsProps, "t" | "selectedGateway" | "setSelectedGateway">) {
  return (
    <>
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

    </>
  );
}
