"use client";

import React, { useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  Shield,
  CreditCard,
  Phone,
  Mail,
  Car,
  Wallet,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useStep3 } from "@/hooks/form/form-steps/useStep3";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCurrency } from "@/contexts/CurrencyContext";

const StripeProvider = dynamic(
  () => import("@/components/providers/stripe-provider"),
  { ssr: false }
);
const StripePaymentForm = dynamic(
  () => import("@/components/payment/StripePaymentForm"),
  { ssr: false }
);

export default function Step3Payment() {
  const {
    // State
    stripeConfig,
    paymentSettings,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    clientSecret,
    creatingPaymentIntent,
    paymentError,

    // Map state
    mapLoaded,
    mapRef,

    // Context values
    formData,
    setFormData,
    errors,
    selectedVehicle,
    distanceData,
    isLoading,

    // Calculated values
    vehiclePrice,
    childSeatPrice,
    babySeatPrice,
    stopsTotalPrice,
    totalPrice,

    // Functions
    handleStripePaymentSuccess,
    handleStripePaymentError,
    handleCashBooking,
    handleBankTransferBooking,
    handleMultisafepayBooking,
    handleBack,
  } = useStep3();

  const { currencySymbol } = useCurrency();

  const t = useTranslations();

  // Initialize payment method based on available options
  useEffect(() => {
    if (paymentSettings?.acceptedPaymentMethods && !selectedPaymentMethod) {
      // Default to the first available payment method
      if (paymentSettings.acceptedPaymentMethods.includes("card") && stripeConfig.enabled) {
        setSelectedPaymentMethod("card");
      } else if (paymentSettings.acceptedPaymentMethods.includes("cash")) {
        setSelectedPaymentMethod("cash");
      } else if (paymentSettings.acceptedPaymentMethods.includes("bank_transfer")) {
        setSelectedPaymentMethod("bank_transfer");
      }
    }
  }, [paymentSettings, selectedPaymentMethod, setSelectedPaymentMethod, stripeConfig.enabled]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Payment Form */}
      <div className="lg:col-span-2 space-y-4">
        {/* Optional Extras */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 text-lg">{t('Step3.optional-extras')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('Step3.child-seats')}</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {currencySymbol}{childSeatPrice} {t('Step3.each')}
                </span>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  className="w-20"
                  value={formData.childSeats === 0 ? "" : formData.childSeats}
                  placeholder="0"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setFormData((prev) => ({ ...prev, childSeats: 0 }));
                      return;
                    }
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
                      setFormData((prev) => ({ ...prev, childSeats: numValue }));
                    }
                  }}
                  onBlur={() => {
                    if (isNaN(formData.childSeats) || formData.childSeats < 0) {
                      setFormData((prev) => ({ ...prev, childSeats: 0 }));
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('Step3.baby-seats')}</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {currencySymbol}{babySeatPrice} {t('Step3.each')}
                </span>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  className="w-20"
                  value={formData.babySeats === 0 ? "" : formData.babySeats}
                  placeholder="0"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setFormData((prev) => ({ ...prev, babySeats: 0 }));
                      return;
                    }
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
                      setFormData((prev) => ({ ...prev, babySeats: numValue }));
                    }
                  }}
                  onBlur={() => {
                    if (isNaN(formData.babySeats) || formData.babySeats < 0) {
                      setFormData((prev) => ({ ...prev, babySeats: 0 }));
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                {t('Step3.special-requests-optional')} </label>
              <Input
                placeholder={t('Step3.any-special-requirements-or-notes')}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                {t('Step3.flight-number-optional')} </label>
              <Input
                placeholder="e.g. LH 1234"
                value={formData.flightNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, flightNumber: e.target.value }))
                }
              />
            </div>
          </div>
        </Card>

        {/* Personal Details */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 text-lg">{t('Step3.personal-details')}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  {t('Step3.first-name')} </label>
                <Input
                  placeholder={t('Step3.john')}
                  className={errors.firstName ? "border-red-500" : ""}
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }));
                  }}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  {t('Step3.last-name')} </label>
                <Input
                  placeholder={t('Step3.doe')}
                  className={errors.lastName ? "border-red-500" : ""}
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }));
                  }}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                {t('Step3.email-address')} </label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                className={errors.email ? "border-red-500" : ""}
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                }}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                {t('Step3.phone-number')} </label>
              <Input
                placeholder="+41 76 123 4567"
                className={errors.phone ? "border-red-500" : ""}
                value={formData.phone}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, phone: e.target.value }));
                }}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Payment Details */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('Step3.payment-method')} </h3>

          {/* Payment Method Selection */}
          {paymentSettings?.acceptedPaymentMethods &&
          paymentSettings.acceptedPaymentMethods.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {paymentSettings.acceptedPaymentMethods.includes("card") &&
                  stripeConfig.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("card")}
                      className={`p-4 border-2 rounded-xl text-left transition-all relative overflow-hidden ${
                        selectedPaymentMethod === "card"
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              selectedPaymentMethod === "card"
                                ? "bg-blue-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <CreditCard
                              className={`h-5 w-5 ${
                                selectedPaymentMethod === "card"
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {t('Step3.credit-debit-card')} </p>
                            <p className="text-xs text-gray-500">
                              Visa, Mastercard, Amex
                            </p>
                          </div>
                        </div>
                        {selectedPaymentMethod === "card" && (
                          <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </button>
                  )}

                {paymentSettings.acceptedPaymentMethods.includes("multisafepay") && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("multisafepay")}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedPaymentMethod === "multisafepay"
                        ? "border-[#00ABEE] bg-[#00ABEE]/10 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedPaymentMethod === "multisafepay"
                              ? "bg-[#00ABEE]/10"
                              : "bg-gray-100"
                          }`}
                        >
                          <CreditCard
                            className={`h-5 w-5 ${
                              selectedPaymentMethod === "multisafepay"
                                ? "text-[#00ABEE]"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {t('Step3.pay-online')} <span className="text-sm font-normal">{t('Step3.via-multisafepay')}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {t('Step3.ideal-bancontact-paypal-and-more')} </p>
                        </div>
                      </div>
                      {selectedPaymentMethod === "multisafepay" && (
                        <div className="flex items-center gap-1 text-[#00ABEE] text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </button>
                )}

                {paymentSettings.acceptedPaymentMethods.includes("cash") && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("cash")}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedPaymentMethod === "cash"
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedPaymentMethod === "cash"
                              ? "bg-green-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Wallet
                            className={`h-5 w-5 ${
                              selectedPaymentMethod === "cash"
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {t('Step3.cash-payment')} </p>
                          <p className="text-xs text-gray-500">
                            {t('Step3.pay-in-cash-to-the-driver')} </p>
                        </div>
                      </div>
                      {selectedPaymentMethod === "cash" && (
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </button>
                )}

                {paymentSettings.acceptedPaymentMethods.includes(
                  "bank_transfer"
                ) && (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("bank_transfer")}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedPaymentMethod === "bank_transfer"
                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedPaymentMethod === "bank_transfer"
                              ? "bg-indigo-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Building2
                            className={`h-5 w-5 ${
                              selectedPaymentMethod === "bank_transfer"
                                ? "text-indigo-600"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {t('Step3.bank-transfer')} </p>
                          <p className="text-xs text-gray-500">
                            {t('Step3.transfer-to-our-bank-account')} </p>
                        </div>
                      </div>
                      {selectedPaymentMethod === "bank_transfer" && (
                        <div className="flex items-center gap-1 text-indigo-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </button>
                )}
              </div>

              {/* Stripe Card Payment */}
              {selectedPaymentMethod === "card" &&
                stripeConfig.publishableKey && (
                  <div className="mt-4">
                    {paymentError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900 mb-1">
                              {t('Step3.payment-initialization-error')} </p>
                            <p className="text-sm text-red-800 mb-3">
                              {paymentError}
                            </p>
                            <Button
                              onClick={() => {
                                // Reset payment state - handled by hook
                                window.location.reload();
                              }}
                              variant="outline"
                              className="text-sm"
                            >
                              {t('Step3.try-again')} </Button>
                          </div>
                        </div>
                      </div>
                    ) : !clientSecret ? (
                      <div className="flex flex-col items-center justify-center py-8 text-sm text-gray-600">
                        <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
                        <p>{t('Step3.loading-payment-options')}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {t('Step3.this-may-take-a-few-seconds')} </p>
                      </div>
                    ) : (
                      <StripeProvider
                        publishableKey={stripeConfig.publishableKey}
                        clientSecret={clientSecret}
                      >
                        <StripePaymentForm
                          amount={totalPrice}
                          currency={(
                            paymentSettings?.stripeCurrency || "eur"
                          ).toUpperCase()}
                          onSuccess={handleStripePaymentSuccess}
                          onError={handleStripePaymentError}
                        />
                      </StripeProvider>
                    )}
                  </div>
                )}

              {/* Cash Payment Info */}
              {selectedPaymentMethod === "cash" && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 mb-1">
                        {t('Step3.cash-payment-selected')} </p>
                      <p className="text-sm text-green-800">
                        {t('Step3.you-will-pay-eur')}{currencySymbol}{totalPrice.toFixed(2)} {t('Step3.in-cash-directly-to-the-driver-at-pickup')} </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCashBooking}
                    disabled={isLoading}
                    className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('Step3.confirming-booking')} </>
                    ) : (
                      <>{t('Step3.confirm-booking-pay-cash-on-arrival')}</>
                    )}
                  </Button>
                </div>
              )}

              {/* Bank Transfer Info */}
              {selectedPaymentMethod === "bank_transfer" && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-1">
                        {t('Step3.bank-transfer-instructions')} </p>
                      <p className="text-sm text-blue-800">
                        {t('Step3.please-transfer-eur')}{currencySymbol}{totalPrice.toFixed(2)} {t('Step3.to-the-account-below-your-booking-will-be-confirmed-once-payment-is-received')} </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 space-y-3 text-sm">
                    {paymentSettings.bankName && (
                      <div>
                        <p className="text-gray-500 text-xs">{t('Step3.bank-name')}</p>
                        <p className="font-medium">
                          {paymentSettings.bankName}
                        </p>
                      </div>
                    )}
                    {paymentSettings.bankAccountName && (
                      <div>
                        <p className="text-gray-500 text-xs">{t('Step3.account-name')}</p>
                        <p className="font-medium">
                          {paymentSettings.bankAccountName}
                        </p>
                      </div>
                    )}
                    {paymentSettings.bankAccountNumber && (
                      <div>
                        <p className="text-gray-500 text-xs">{t('Step3.account-number')}</p>
                        <p className="font-medium">
                          {paymentSettings.bankAccountNumber}
                        </p>
                      </div>
                    )}
                    {paymentSettings.bankIBAN && (
                      <div>
                        <p className="text-gray-500 text-xs">IBAN</p>
                        <p className="font-medium font-mono">
                          {paymentSettings.bankIBAN}
                        </p>
                      </div>
                    )}
                    {paymentSettings.bankSwiftBIC && (
                      <div>
                        <p className="text-gray-500 text-xs">SWIFT/BIC</p>
                        <p className="font-medium">
                          {paymentSettings.bankSwiftBIC}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleBankTransferBooking}
                    disabled={isLoading}
                    className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('Step3.confirming-booking')} </>
                    ) : (
                      <>{t('Step3.confirm-booking-i-will-transfer-payment')}</>
                    )}
                  </Button>
                </div>
              )}

              {/* MultiSafepay Payment */}
              {selectedPaymentMethod === "multisafepay" && (
                <div className="mt-4">
                  <div className="bg-[#00ABEE]/10 border border-[#00ABEE] rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-[#00ABEE] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-[#00ABEE] mb-1">
                          MultiSafepay Payment
                        </p>
                        <p className="text-sm text-[#00ABEE]">
                          {t('Step3.confirming.you-will-be-redirected-to-multisafepay-to-complete-your-payment-securely-multiple-payment-methods-available-including-ideal-bancontact-paypal-and-more')} </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleMultisafepayBooking}
                    disabled={isLoading}
                    className="w-full bg-[#00ABEE] hover:bg-[#00ABEE]/80 text-white font-semibold py-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>{t('Step3.confirming.continue-to-multisafepay')}</>
                    )}
                  </Button>
                </div>
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1"
            disabled={isLoading || creatingPaymentIntent}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('Step3.back-to-vehicles')}
          </Button>
        </div>
      </div>

      {/* Sidebar - Booking Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4 p-5 space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">{t('Step3.booking-summary')}</h3>

          {/* Map */}
          {mapLoaded && (
            <div className="border rounded-lg overflow-hidden">
              <div
                ref={mapRef}
                className="w-full h-48 bg-gray-100"
                style={{ minHeight: "200px" }}
              />
            </div>
          )}

          {/* Trip Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">{t('Step3.pickup')}</p>
                <p className="font-medium text-gray-900">{formData.pickup}</p>
              </div>
            </div>

            {/* Stops */}
            {formData.stops
              .filter(stop => stop.location.trim())
              .map((stop, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-gray-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('Step1.stop')} {index + 1}</p>
                    <p className="font-medium text-gray-900">{stop.location}</p>
                  </div>
                </div>
              ))}

            {formData.bookingType === "destination" ? (
              <>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">{t('Step3.dropoff')}</p>
                    <p className="font-medium text-gray-900">
                      {formData.dropoff}
                    </p>
                  </div>
                </div>

                {distanceData && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">
                        {distanceData.duration.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                      <span className="text-gray-700">
                        {distanceData.distance.text} -{" "}
                        {formData.tripType === "oneway"
                          ? t('Step3.one-way')
                          : t('Step3.round-trip')}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">
                  {formData.duration}{" "}
                  {formData.duration === 1 ? "hour" : "hours"} {t('Step3.hourly-booking')}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">
                {formData.tripType === "roundtrip" ? t('Step3.departure') : t('Step3.date')}: {formData.date} at {formData.time}
              </span>
            </div>

            {formData.tripType === "roundtrip" && formData.returnDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">
                  {t('Step3.return')}: {formData.returnDate} at {formData.returnTime}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">
                {formData.passengers} Passenger(s)
              </span>
            </div>
          </div>

          {/* Selected Vehicle */}
          {selectedVehicle && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{t('Step3.selected-vehicle')}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedVehicle.name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedVehicle.description}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-600">{t('Step3.base-fare')}</span>
                  <span className="font-semibold">
                    {currencySymbol}{vehiclePrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Extras */}
          {(formData.childSeats > 0 || formData.babySeats > 0 || stopsTotalPrice > 0) && (
            <div className="border-t pt-3">
              <p className="font-semibold text-sm mb-2">{t('Step3.extras')}</p>
              <div className="space-y-1 text-sm">
                {formData.childSeats > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t('Step3.child-seatsx')} {formData.childSeats}
                    </span>
                    <span className="font-medium">
                      {currencySymbol}{(formData.childSeats * childSeatPrice).toFixed(2)}
                    </span>
                  </div>
                )}
                {formData.babySeats > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t('Step3.baby-seatsx')} {formData.babySeats}
                    </span>
                    <span className="font-medium">
                      {currencySymbol}{(formData.babySeats * babySeatPrice).toFixed(2)}
                    </span>
                  </div>
                )}
                {stopsTotalPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Stops ({formData.stops?.length || 0})
                    </span>
                    <span className="font-medium">
                      {currencySymbol}{stopsTotalPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>TOTAL</span>
              <span className="text-2xl text-primary">
                {currencySymbol}{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="border-t pt-3 space-y-2">
            <h4 className="font-semibold text-sm mb-2">{t('Step3.what-and-apos-s-included')}</h4>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t('Step3.door-to-door-service')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t('Step3.meet-and-greet')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t('Step3.instant-confirmation')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>{t('Step3.secure-payment')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t('Step3.free-cancellation-24h')}</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span>{t('Step3.24-7-customer-support')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-500" />
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                className="hover:text-primary"
              >
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-500" />
              <a href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER}`} className="hover:text-primary">
                {process.env.NEXT_PUBLIC_PHONE_NUMBER}
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}