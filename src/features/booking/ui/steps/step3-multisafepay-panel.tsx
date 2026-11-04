"use client";

import type { Step3PaymentMethodsProps } from "@/features/booking/ui/steps/step3-payment-methods.types";
import { Button } from "@/shared/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

export function Step3MultisafepayPanel({
  t,
  handleMultisafepayBooking,
  isLoading,
  contactValid,
}: Pick<
  Step3PaymentMethodsProps,
  "t" | "handleMultisafepayBooking" | "isLoading" | "contactValid"
>) {
  return (
                <div className="mt-4">
                  <div className="bg-[var(--brand-multisafepay)]/10 border border-[var(--brand-multisafepay)] rounded p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-[var(--brand-multisafepay)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-[var(--brand-multisafepay)] mb-1">
                          MultiSafepay Payment
                        </p>
                        <p className="text-sm text-[var(--brand-multisafepay)]">
                          {t('Step3.confirming.you-will-be-redirected-to-multisafepay-to-complete-your-payment-securely-multiple-payment-methods-available-including-ideal-bancontact-paypal-and-more')} </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleMultisafepayBooking}
                    disabled={isLoading || !contactValid}
                    className="w-full bg-[var(--brand-multisafepay)] hover:bg-[var(--brand-multisafepay)]/80 text-white font-semibold py-6"
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
  );
}
