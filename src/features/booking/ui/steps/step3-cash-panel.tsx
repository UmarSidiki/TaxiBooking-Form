"use client";

import type { Step3PaymentMethodsProps } from "@/features/booking/ui/steps/step3-payment-methods.types";
import { Button } from "@/shared/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export function Step3CashPanel({
  t,
  currencySymbol,
  totalPrice,
  handleCashBooking,
  isLoading,
  contactValid,
}: Pick<
  Step3PaymentMethodsProps,
  "t" | "currencySymbol" | "totalPrice" | "handleCashBooking" | "isLoading" | "contactValid"
>) {
  return (
                <div className="mt-4 bg-[var(--well)] border border-[var(--rule)] rounded p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[color:var(--ok)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[color:var(--ink)] mb-1">
                        {t('Step3.cash-payment-selected')} </p>
                      <p className="text-sm text-[color:var(--ink2)]">
                        {t('Step3.you-will-pay-eur')}{currencySymbol}{totalPrice.toFixed(2)} {t('Step3.in-cash-directly-to-the-driver-at-pickup')} </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCashBooking}
                    disabled={isLoading || !contactValid}
                    className="btn-primary w-full mt-4 py-6"
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
