"use client";

import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";
import { Step3StripePanel } from "@/features/booking/ui/steps/step3-stripe-panel";
import type { Step3PaymentMethodsProps } from "@/features/booking/ui/steps/step3-payment-methods.types";

export function Step3DepositPanel({
  mode,
  depositAmount,
  balanceAmount,
  multisafepayReady,
  handleMultisafepay,
  ...props
}: Step3PaymentMethodsProps & {
  mode: "cash" | "appointment";
  depositAmount: number;
  balanceAmount: number;
  multisafepayReady: boolean;
  handleMultisafepay: () => void;
}) {
  const { t, currencySymbol, isLoading } = props;
  const onlineReady = Boolean(props.stripeConfig.publishableKey) || multisafepayReady;

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="rounded border border-[var(--rule)] bg-[var(--well)] p-4">
        <p className="font-medium text-[color:var(--ink)]">
          {t("Step3.pay-deposit-to-confirm")}
        </p>
        <dl className="mt-2 flex flex-col gap-1 text-sm text-[color:var(--ink2)]">
          <div className="flex items-center justify-between gap-2">
            <dt>{t("Step3.due-now-online")}</dt>
            <dd className="font-semibold tabular-nums text-[color:var(--ink)]">
              {currencySymbol}
              {depositAmount.toFixed(2)}
            </dd>
          </div>
          {balanceAmount > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <dt>
                {mode === "cash"
                  ? t("Step3.deposit-rest-cash")
                  : t("Step3.deposit-credited-to-quote")}
              </dt>
              <dd className="tabular-nums">
                {currencySymbol}
                {balanceAmount.toFixed(2)}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {onlineReady ? (
        <>
          <Step3StripePanel
            t={props.t}
            stripeConfig={props.stripeConfig}
            paymentSettings={props.paymentSettings}
            clientSecret={props.clientSecret}
            stripeOrderId={props.stripeOrderId}
            contactValid={props.contactValid}
            paymentError={props.paymentError}
            retryStripePayment={props.retryStripePayment}
            totalPrice={depositAmount}
            handleStripePaymentSuccess={props.handleStripePaymentSuccess}
            handleStripePaymentError={props.handleStripePaymentError}
            formData={props.formData}
            displaySubtotalAmount={props.displaySubtotalAmount}
            taxAmount={props.taxAmount}
            enableTax={props.enableTax}
            taxPercentage={props.taxPercentage}
          />
          {multisafepayReady ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full"
              disabled={isLoading || !props.contactValid}
              onClick={handleMultisafepay}
            >
              {isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t("Step3.pay-deposit-online")}
            </Button>
          ) : null}
        </>
      ) : (
        <p role="alert" className="text-sm text-[color:var(--err)]">
          {t("Step3.online-payment-not-configured")}
        </p>
      )}
    </div>
  );
}
