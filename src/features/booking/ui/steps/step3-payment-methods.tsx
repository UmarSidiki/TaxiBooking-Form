"use client";

import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { Step3PaymentMethodOptions } from "@/components/form/steps/step3-payment-method-options";
import { Step3StripePanel } from "@/components/form/steps/step3-stripe-panel";
import { Step3CashPanel } from "@/components/form/steps/step3-cash-panel";
import { Step3BankPanel } from "@/components/form/steps/step3-bank-panel";
import { Step3MultisafepayPanel } from "@/components/form/steps/step3-multisafepay-panel";
import type { Step3PaymentMethodsProps } from "@/components/form/steps/step3-payment-methods.types";

export function Step3PaymentMethods(props: Step3PaymentMethodsProps) {
  const {
    t,
    paymentSettings,
    selectedPaymentMethod,
  } = props;

  return (
    <>
        {/* Payment Details */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('Step3.payment-method')} </h3>

          {/* Payment Method Selection */}
          {paymentSettings?.acceptedPaymentMethods &&
          paymentSettings.acceptedPaymentMethods.length > 0 ? (
            <div className="space-y-4">
              <Step3PaymentMethodOptions
                t={props.t}
                paymentSettings={props.paymentSettings}
                stripeConfig={props.stripeConfig}
                selectedPaymentMethod={props.selectedPaymentMethod}
                setSelectedPaymentMethod={props.setSelectedPaymentMethod}
              />

              {/* Stripe Card Payment */}
              {selectedPaymentMethod === "card" && (
                <Step3StripePanel
                  t={props.t}
                  stripeConfig={props.stripeConfig}
                  paymentSettings={props.paymentSettings}
                  clientSecret={props.clientSecret}
                  stripeOrderId={props.stripeOrderId}
                  paymentError={props.paymentError}
                  retryStripePayment={props.retryStripePayment}
                  totalPrice={props.totalPrice}
                  handleStripePaymentSuccess={props.handleStripePaymentSuccess}
                  handleStripePaymentError={props.handleStripePaymentError}
                  formData={props.formData}
                  displaySubtotalAmount={props.displaySubtotalAmount}
                  taxAmount={props.taxAmount}
                  enableTax={props.enableTax}
                  taxPercentage={props.taxPercentage}
                />
              )}

              {/* Cash Payment Info */}
              {selectedPaymentMethod === "cash" && (
                <Step3CashPanel
                  t={props.t}
                  currencySymbol={props.currencySymbol}
                  totalPrice={props.totalPrice}
                  handleCashBooking={props.handleCashBooking}
                  isLoading={props.isLoading}
                />
              )}

              {/* Bank Transfer Info */}
              {selectedPaymentMethod === "bank_transfer" && (
                <Step3BankPanel
                  t={props.t}
                  currencySymbol={props.currencySymbol}
                  paymentSettings={props.paymentSettings}
                  totalPrice={props.totalPrice}
                  handleBankTransferBooking={props.handleBankTransferBooking}
                  isLoading={props.isLoading}
                />
              )}

              {/* MultiSafepay Payment */}
              {selectedPaymentMethod === "multisafepay" && (
                <Step3MultisafepayPanel
                  t={props.t}
                  handleMultisafepayBooking={props.handleMultisafepayBooking}
                  isLoading={props.isLoading}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-2">
                {t('Step3.no-payment-methods-configured')} </p>
              <p className="text-sm text-gray-500">
                {t('Step3.please-contact-the-administrator-to-set-up-payment-processing')} </p>
            </div>
          )}
        </Card>
    </>
  );
}
