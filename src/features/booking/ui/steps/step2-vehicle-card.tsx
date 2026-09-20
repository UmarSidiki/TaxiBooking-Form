"use client";

import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import type { DistanceData, FormData } from "@/features/booking/context/booking-form-context";
import { DEFAULT_VEHICLE_MINIMUM_HOURS } from "@/features/fleet/lib/vehicle-form-defaults";
import type { IVehicle } from "@/features/fleet/model";
import {
  CheckCircle2,
  Loader2,
  Shield,
  Users,
} from "lucide-react";
import Image from "next/image";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function Step2VehicleCard({
  vehicle,
  formData,
  distanceData,
  calculatingDistance,
  calculatedPrice,
  originalPrice,
  isSelected,
  isBestPrice,
  currencySymbol,
  handleVehicleSelect,
  t,
}: {
  vehicle: IVehicle;
  formData: FormData;
  distanceData: DistanceData | null;
  calculatingDistance: boolean;
  calculatedPrice: number;
  originalPrice: number;
  isSelected: boolean;
  isBestPrice: boolean;
  currencySymbol: string;
  handleVehicleSelect: (vehicleId: string) => void;
  t: TFn;
}) {
  const discountValue = parseFloat(String(vehicle.discount || "0"));

  return (
                <Card
                  className={`relative overflow-hidden transition-all ${
                    isSelected
                      ? "border-primary border-2 shadow-lg"
                      : isBestPrice
                      ? "border-secondary border-2"
                      : "border-gray-200 hover:border-primary/70"
                  }`}
                >
                  <div className="p-3 sm:p-4">
                    {/* Vehicle Image - Full width on mobile, side-by-side on desktop */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="w-full sm:w-auto flex-shrink-0">
                        {vehicle.image ? (
                          <Image
                            src={vehicle.image}
                            alt={vehicle.name}
                            width={200}
                            height={150}
                            className="w-full sm:w-[300px] sm:h-[180px] h-[150px] rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-full sm:w-[200px] sm:h-[180px] h-[150px] bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-sm">
                              {t("Step2.no-image")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Vehicle Details */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-1">
                          <div className="mb-1 sm:mb-0">
                            <h3 className="font-bold text-lg sm:text-base">
                              {vehicle.name}
                            </h3>
                            <div className="flex flex-wrap gap-1">
                              {isBestPrice && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  {t("Step2.best-price")}
                                </span>
                              )}
                              {discountValue > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  🎉 {vehicle.discount}
                                  {t("Step2.off")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {(formData.bookingType === "destination" && !distanceData) || calculatingDistance ? (
                                <div className="flex flex-col items-end justify-center min-h-[4rem]">
                                    {calculatingDistance ? (
                                        <div className="flex items-center gap-2 text-primary">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-xs">Calculating...</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-medium text-amber-600">Price unavailable</span>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {distanceData &&
                                    originalPrice > calculatedPrice && (
                                        <p className="text-xs text-gray-500 line-through">
                                        {currencySymbol}
                                        {originalPrice.toFixed(2)}
                                        </p>
                                    )}
                                    <p className="text-xl font-bold text-gray-900">
                                    {currencySymbol}
                                    {calculatedPrice.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                    {formData.bookingType === "hourly"
                                        ? `${Math.max(
                                            formData.duration,
                                            vehicle.minimumHours || DEFAULT_VEHICLE_MINIMUM_HOURS
                                        )} ${t("Step2.hours")}`
                                        : distanceData
                                        ? formData.tripType === "roundtrip"
                                        ? t("Step2.total-round-trip")
                                        : t("Step2.total-one-way")
                                        : t("Step2.starting-from")}
                                    </p>
                                </>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {vehicle.description}
                        </p>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span>
                              {t("Step2.passenger-allowance", {
                                0: vehicle.persons || "",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4 text-blue-600 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                            </svg>
                            <span>
                              {t("Step2.baggage-allowance", {
                                0: vehicle.baggages || "",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span>{t("Step2.licensed-chauffeur")}</span>
                          </div>
                          {vehicle.minimumFare && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{t("Step2.free-cancellation")}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-auto">
                          <Button
                            onClick={() => handleVehicleSelect(vehicle._id!)}
                            className={`w-full py-2 text-base font-medium ${
                              isSelected
                                ? "bg-primary hover:bg-primary/90"
                                : "bg-secondary hover:bg-secondary/90"
                            } text-white`}
                          >
                            {isSelected
                              ? t("Step2.selected")
                              : t("Step2.select")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
  );
}
