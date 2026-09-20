"use client";

import { Input } from "@/components/ui/input";
import type { PaymentTabFieldsProps } from "@/components/settings/payment-tab-props";
import { Banknote, Building2, CreditCard } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";


export function PaymentTabInfo({ t }: Pick<PaymentTabFieldsProps, "t">) {
  return (
    <>
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
    </>
  );
}
