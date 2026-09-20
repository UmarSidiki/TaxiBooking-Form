"use client";

import { Input } from "@/shared/ui/input";
import type { PaymentTabFieldsProps } from "@/features/settings/ui/payment-tab-props";
import { Banknote, Building2, CreditCard } from "lucide-react";
import { useCurrency } from "@/shared/context/currency-context";


export function PaymentTabInfo({ t }: Pick<PaymentTabFieldsProps, "t">) {
  return (
    <>
        {/* Info Notice */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-foreground">
            <strong>{t("Dashboard.Settings.tip")}</strong>{" "}
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
