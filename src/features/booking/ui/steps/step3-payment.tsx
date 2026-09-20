"use client";

import React, { memo, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useStep3 } from "@/features/booking/hooks/form-steps/useStep3";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/shared/context/currency-context";
import { Step3BookingSummary } from "@/features/booking/ui/steps/step3-booking-summary";
import { Step3Extras } from "@/features/booking/ui/steps/step3-extras";
import { Step3PaymentMethods } from "@/features/booking/ui/steps/step3-payment-methods";
import { Step3PersonalDetails } from "@/features/booking/ui/steps/step3-personal-details";

function Step3Payment() {
  const step = useStep3();
  const {
    stripeConfig,
    paymentSettings,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    creatingPaymentIntent,
    isLoading,
    handleBack,
  } = step;

  const { currencySymbol } = useCurrency();
  const t = useTranslations();

  useEffect(() => {
    if (paymentSettings?.acceptedPaymentMethods && !selectedPaymentMethod) {
      if (paymentSettings.acceptedPaymentMethods.includes("card") && stripeConfig.enabled) {
        setSelectedPaymentMethod("card");
      } else if (paymentSettings.acceptedPaymentMethods.includes("cash")) {
        setSelectedPaymentMethod("cash");
      } else if (paymentSettings.acceptedPaymentMethods.includes("bank_transfer")) {
        setSelectedPaymentMethod("bank_transfer");
      }
    }
  }, [paymentSettings, selectedPaymentMethod, setSelectedPaymentMethod, stripeConfig]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Step3Extras
          t={t}
          currencySymbol={currencySymbol}
          formData={step.formData}
          setFormData={step.setFormData}
          childSeatPrice={step.childSeatPrice}
          babySeatPrice={step.babySeatPrice}
          errors={step.errors}
        />
        <Step3PersonalDetails
          t={t}
          formData={step.formData}
          setFormData={step.setFormData}
          errors={step.errors}
        />
        <Step3PaymentMethods
          t={t}
          currencySymbol={currencySymbol}
          stripeConfig={step.stripeConfig}
          paymentSettings={step.paymentSettings}
          selectedPaymentMethod={step.selectedPaymentMethod}
          setSelectedPaymentMethod={step.setSelectedPaymentMethod}
          clientSecret={step.clientSecret}
          stripeOrderId={step.stripeOrderId}
          creatingPaymentIntent={step.creatingPaymentIntent}
          paymentError={step.paymentError}
          retryStripePayment={step.retryStripePayment}
          totalPrice={step.totalPrice}
          handleStripePaymentSuccess={step.handleStripePaymentSuccess}
          handleStripePaymentError={step.handleStripePaymentError}
          handleCashBooking={step.handleCashBooking}
          handleBankTransferBooking={step.handleBankTransferBooking}
          handleMultisafepayBooking={step.handleMultisafepayBooking}
          isLoading={step.isLoading}
          formData={step.formData}
          displaySubtotalAmount={step.displaySubtotalAmount}
          taxAmount={step.taxAmount}
          enableTax={step.enableTax}
          taxPercentage={step.taxPercentage}
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1"
            disabled={isLoading || creatingPaymentIntent}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Step3.back-to-vehicles")}
          </Button>
        </div>
      </div>
      <Step3BookingSummary
        t={t}
        currencySymbol={currencySymbol}
        mapLoaded={step.mapLoaded}
        mapRef={step.mapRef}
        formData={step.formData}
        selectedVehicle={step.selectedVehicle}
        distanceData={step.distanceData}
        vehiclePrice={step.vehiclePrice}
        discount={step.discount}
        discountedVehiclePrice={step.discountedVehiclePrice}
        childSeatPrice={step.childSeatPrice}
        babySeatPrice={step.babySeatPrice}
        stopsTotalPrice={step.stopsTotalPrice}
        subtotalPrice={step.subtotalPrice}
        enableTax={step.enableTax}
        taxPercentage={step.taxPercentage}
        taxIncluded={step.taxIncluded}
        taxAmount={step.taxAmount}
        totalPrice={step.totalPrice}
        displaySubtotalAmount={step.displaySubtotalAmount}
      />
    </div>
  );
}

export default memo(Step3Payment);
