"use client";

import type { FormData } from "@/contexts/BookingFormContext";
import { buildStopCostBreakdown } from "@/lib/form/build-stop-cost-breakdown";
import type { IVehicle } from "@/models/vehicle";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function Step2PriceBreakdown({
  formData,
  vehicles,
  calculatePrice,
  enableTax,
  taxPercentage,
  taxIncluded,
  currencySymbol,
  t,
}: {
  formData: FormData;
  vehicles: IVehicle[];
  calculatePrice: (vehicle: IVehicle) => number;
  enableTax: boolean;
  taxPercentage: number;
  taxIncluded: boolean;
  currencySymbol: string;
  t: TFn;
}) {
  if (!formData.selectedVehicle || vehicles.length === 0) {
    return null;
  }

  const selectedVehicle = vehicles.find(
    (v) => v._id === formData.selectedVehicle
  )!;
  const totalPrice = calculatePrice(selectedVehicle);

  const { validStops, stopCosts, stopBreakdown } = buildStopCostBreakdown(
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
                          {t('Dashboard.Rides.Stops')} ({validStops.length})
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
                    (() => {
                      // Calculate tax correctly based on taxIncluded setting
                      const taxAmount = taxIncluded 
                        ? totalPrice - (totalPrice / (1 + taxPercentage / 100)) // Extract tax from price
                        : totalPrice * (taxPercentage / 100); // Add tax to price
                      const displaySubtotal = taxIncluded 
                        ? totalPrice - taxAmount // Pre-tax amount when tax is included
                        : totalPrice; // Base price when tax is added
                      const finalTotal = taxIncluded ? totalPrice : totalPrice + taxAmount;
                      
                      return (
                        <>
                          <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                            <span>{t("Step2.subtotal")}</span>
                            <span>
                              {currencySymbol}
                              {displaySubtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                            <span>{t("Step2.tax", { 0: taxPercentage })}{taxIncluded ? ` - ${t("Step2.included")}` : ''}</span>
                            <span>
                              {currencySymbol}
                              {taxAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span>{t("Step2.total")}</span>
                            <div className="text-right">
                              <p className="text-gray-900">
                                {currencySymbol}
                                {finalTotal.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 font-normal">{t("Step2.incl-tax")}</p>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{t("Step2.total")}</span>
                      <div className="text-right">
                        <p className="text-gray-900">
                          {currencySymbol}
                          {totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
  );
}
