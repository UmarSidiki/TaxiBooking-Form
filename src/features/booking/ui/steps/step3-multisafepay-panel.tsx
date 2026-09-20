"use client";

import type { Step3PaymentMethodsProps } from "@/features/booking/ui/steps/step3-payment-methods.types";
import { Button } from "@/shared/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

export function Step3MultisafepayPanel({
  t,
  handleMultisafepayBooking,
  isLoading,
}: Pick<
  Step3PaymentMethodsProps,
  "t" | "handleMultisafepayBooking" | "isLoading"
>) {
  return (
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
  );
}
