"use client";

import type { Step3PaymentMethodsProps } from "@/features/booking/ui/steps/step3-payment-methods.types";
import { Building2, CheckCircle2, CreditCard, Wallet } from "lucide-react";

export function Step3PaymentMethodOptions({
  t,
  paymentSettings,
  stripeConfig,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
}: Pick<
  Step3PaymentMethodsProps,
  | "t"
  | "paymentSettings"
  | "stripeConfig"
  | "selectedPaymentMethod"
  | "setSelectedPaymentMethod"
>) {
  return (
              <div className="grid grid-cols-1 gap-3">
                {paymentSettings?.acceptedPaymentMethods.includes("card") &&
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

                {paymentSettings?.acceptedPaymentMethods.includes("multisafepay") && (
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

                {paymentSettings?.acceptedPaymentMethods.includes("cash") && (
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

                {paymentSettings?.acceptedPaymentMethods.includes(
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
  );
}
