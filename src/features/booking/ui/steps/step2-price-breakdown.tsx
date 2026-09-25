"use client";

import type { FormData } from "@/features/booking/context/booking-form-context";
import { buildStopCostBreakdown } from "@/features/booking/lib/build-stop-cost-breakdown";
import type { BookingPriceResult } from "@/features/payments/lib/fare/calculate-booking-price";
import type { IVehicle } from "@/features/fleet/model";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function Step2PriceBreakdown({
  formData,
  vehicles,
  priceBreakdown,
  enableTax,
  taxPercentage,
  taxIncluded,
  currencySymbol,
  t,
}: {
  formData: FormData;
  vehicles: IVehicle[];
  priceBreakdown: BookingPriceResult | null;
  enableTax: boolean;
  taxPercentage: number;
  taxIncluded: boolean;
  currencySymbol: string;
  t: TFn;
}) {
  if (!formData.selectedVehicle || vehicles.length === 0 || !priceBreakdown) {
    return null;
  }

  const selectedVehicle = vehicles.find(
    (v) => v._id === formData.selectedVehicle
  )!;

  const { stopCosts, stopBreakdown } = buildStopCostBreakdown(
    formData.stops,
    selectedVehicle.stopPrice || 0,
    selectedVehicle.stopPricePerHour || 0
  );

  return (
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">
                      {t("Step2.vehicle-type")}
                    </span>
                    <span className="text-sm font-medium">
                      {selectedVehicle.category}
                    </span>
                  </div>

                  {/* Stop costs breakdown */}
                  {stopCosts > 0 && (
                    <div className="mb-2 space-y-1">
                      <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                        <span>
                          {t('Dashboard.Rides.Stops')} ({stopBreakdown.length})
                        </span>
                        <span>
                          {currencySymbol}{stopCosts.toFixed(2)}
                        </span>
                      </div>
                      <div className="ml-2 space-y-0.5 text-xs text-gray-500">
                        {stopBreakdown.map((stop, index) => (
                          <div key={index} className="flex justify-between">
                            <span>
                              {t('Step1.stop')} {index + 1}
                              {stop.duration > 0 && (
                                <span className="ml-1">({stop.duration}m wait)</span>
                              )}
                            </span>
                            <span>
                              {currencySymbol}{stop.totalCost.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tax and Total */}
                  {enableTax && taxPercentage > 0 ? (
                    <>
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                        <span>{t("Step2.subtotal")}</span>
                        <span>
                          {currencySymbol}
                          {priceBreakdown.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                        <span>{t("Step2.tax", { 0: taxPercentage })}{taxIncluded ? ` - ${t("Step2.included")}` : ''}</span>
                        <span>
                          {currencySymbol}
                          {priceBreakdown.taxAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>{t("Step2.total")}</span>
                        <div className="text-right">
                          <p className="text-gray-900">
                            {currencySymbol}
                            {priceBreakdown.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 font-normal">{t("Step2.incl-tax")}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{t("Step2.total")}</span>
                      <div className="text-right">
                        <p className="text-gray-900">
                          {currencySymbol}
                          {priceBreakdown.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
  );
}
