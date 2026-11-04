"use client";

import type { Step3PaymentMethodsProps } from "@/features/booking/ui/steps/step3-payment-methods.types";

type Method = string;

/** Payment methods as a radio list (styles: .pay-list in riviera.css). */
export function Step3PaymentMethodOptions({
  t,
  paymentSettings,
  stripeConfig,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
}: Pick<
  Step3PaymentMethodsProps,
  | "t"
  | "paymentSettings"
  | "stripeConfig"
  | "selectedPaymentMethod"
  | "setSelectedPaymentMethod"
>) {
  const accepted = paymentSettings?.acceptedPaymentMethods ?? [];
  const options: Array<{ id: Method; title: string; hint: string; show: boolean }> = [
    { id: "card", title: t("Step3.credit-debit-card"), hint: "Visa, Mastercard, Amex", show: accepted.includes("card") && stripeConfig.enabled },
    { id: "multisafepay", title: `${t("Step3.pay-online")} ${t("Step3.via-multisafepay")}`, hint: t("Step3.ideal-bancontact-paypal-and-more"), show: accepted.includes("multisafepay") },
    { id: "cash", title: t("Step3.cash-payment"), hint: t("Step3.pay-in-cash-to-the-driver"), show: accepted.includes("cash") },
    { id: "bank_transfer", title: t("Step3.bank-transfer"), hint: t("Step3.transfer-to-our-bank-account"), show: accepted.includes("bank_transfer") },
  ];

  return (
    <div className="pay-list" role="radiogroup" aria-label={t("Step3.payment-method")}>
      {options
        .filter((o) => o.show)
        .map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selectedPaymentMethod === o.id}
            onClick={() => setSelectedPaymentMethod(o.id)}
          >
            <span className="dot" aria-hidden="true" />
            <span className="t">
              <b>{o.title}</b>
              <small>{o.hint}</small>
            </span>
          </button>
        ))}
    </div>
  );
}
