"use client";

import dynamic from "next/dynamic";
import type { Step3PaymentMethodsProps } from "@/components/form/steps/step3-payment-methods.types";
import { DEFAULT_STRIPE_CURRENCY } from "@/lib/payments/stripe-currency";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

const StripeProvider = dynamic(
  () => import("@/components/providers/stripe-provider"),
  { ssr: false }
);
const StripePaymentForm = dynamic(
  () => import("@/components/payment/StripePaymentForm"),
  { ssr: false }
);

export function Step3StripePanel({
  t,
  stripeConfig,
  paymentSettings,
  clientSecret,
  stripeOrderId,
  paymentError,
  retryStripePayment,
  totalPrice,
  handleStripePaymentSuccess,
  handleStripePaymentError,
  formData,
  displaySubtotalAmount,
  taxAmount,
  enableTax,
  taxPercentage,
}: Pick<
  Step3PaymentMethodsProps,
  | "t"
  | "stripeConfig"
  | "paymentSettings"
  | "clientSecret"
  | "stripeOrderId"
  | "paymentError"
  | "retryStripePayment"
  | "totalPrice"
  | "handleStripePaymentSuccess"
  | "handleStripePaymentError"
  | "formData"
  | "displaySubtotalAmount"
  | "taxAmount"
  | "enableTax"
  | "taxPercentage"
>) {
  if (!stripeConfig.publishableKey) {
    return null;
  }

  return (
                  <div className="mt-4">
                    {paymentError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900 mb-1">
                              {clientSecret
                                ? t('Step3.payment-error')
                                : t('Step3.payment-initialization-error')}{" "}
                            </p>
                            <p className="text-sm text-red-800 mb-3">
                              {paymentError}
                            </p>
                            <Button
                              onClick={retryStripePayment}
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
                            paymentSettings?.stripeCurrency || DEFAULT_STRIPE_CURRENCY
                          ).toUpperCase()}
                          orderId={stripeOrderId || undefined}
                          bookingData={{
                            pickup: formData.pickup,
                            dropoff: formData.dropoff,
                            stops: formData.stops,
                            tripType: formData.tripType,
                            bookingType: formData.bookingType,
                            duration: formData.duration,
                            date: formData.date,
                            time: formData.time,
                            returnDate: formData.returnDate,
                            returnTime: formData.returnTime,
                            passengers: formData.passengers,
                            selectedVehicle: formData.selectedVehicle,
                            childSeats: formData.childSeats,
                            babySeats: formData.babySeats,
                            notes: formData.notes,
                            flightNumber: formData.flightNumber,
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            email: formData.email,
                            phone: formData.phone,
                            totalAmount: totalPrice,
                            subtotalAmount: displaySubtotalAmount,
                            taxAmount: taxAmount,
                            taxPercentage: enableTax ? taxPercentage : 0,
                          }}
                          onSuccess={handleStripePaymentSuccess}
                          onError={handleStripePaymentError}
                        />
                      </StripeProvider>
                    )}
                  </div>
  );
}
