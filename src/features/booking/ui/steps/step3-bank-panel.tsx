"use client";

import type { Step3PaymentMethodsProps } from "@/components/form/steps/step3-payment-methods.types";
import { Button } from "@/components/ui/button";
import { Building2, Loader2 } from "lucide-react";

export function Step3BankPanel({
  t,
  currencySymbol,
  paymentSettings,
  totalPrice,
  handleBankTransferBooking,
  isLoading,
}: Pick<
  Step3PaymentMethodsProps,
  | "t"
  | "currencySymbol"
  | "paymentSettings"
  | "totalPrice"
  | "handleBankTransferBooking"
  | "isLoading"
>) {
  if (!paymentSettings) {
    return null;
  }

  return (
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
  );
}
