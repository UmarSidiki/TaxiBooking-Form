"use client";

import type { Step3PaymentMethodsProps } from "@/components/form/steps/step3-payment-methods.types";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export function Step3CashPanel({
  t,
  currencySymbol,
  totalPrice,
  handleCashBooking,
  isLoading,
}: Pick<
  Step3PaymentMethodsProps,
  "t" | "currencySymbol" | "totalPrice" | "handleCashBooking" | "isLoading"
>) {
  return (
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
  );
}
