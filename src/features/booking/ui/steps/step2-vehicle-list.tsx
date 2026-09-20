"use client";

import type { DistanceData, FormData } from "@/features/booking/context/booking-form-context";
import type { IVehicle } from "@/features/fleet/model";
import { Loader2 } from "lucide-react";
import type { useTranslations } from "next-intl";
import { Step2VehicleCard } from "./step2-vehicle-card";

type TFn = ReturnType<typeof useTranslations>;

export function Step2VehicleList({
  vehicles,
  sortedVehicles,
  formData,
  distanceData,
  calculatingDistance,
  calculatePrice,
  calculateOriginalPrice,
  currencySymbol,
  handleVehicleSelect,
  t,
}: {
  vehicles: IVehicle[];
  sortedVehicles: IVehicle[];
  formData: FormData;
  distanceData: DistanceData | null;
  calculatingDistance: boolean;
  calculatePrice: (vehicle: IVehicle) => number;
  calculateOriginalPrice: (vehicle: IVehicle) => number;
  currencySymbol: string;
  handleVehicleSelect: (vehicleId: string) => void;
  t: TFn;
}) {
  if (vehicles.length === 0) {
    return (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-gray-500 text-sm">
              {t("Step2.loading-available-vehicles")}
            </p>
          </div>
    );
  }

  return (
          <div className="space-y-2">
            {sortedVehicles.map((vehicle, index) => {
              const calculatedPrice = calculatePrice(vehicle);
              const originalPrice = calculateOriginalPrice(vehicle);
              const isSelected = formData.selectedVehicle === vehicle._id;
              const isBestPrice = index === 0; // First vehicle after sorting is the cheapest

              return (
                <Step2VehicleCard
                  key={vehicle._id}
                  vehicle={vehicle}
                  formData={formData}
                  distanceData={distanceData}
                  calculatingDistance={calculatingDistance}
                  calculatedPrice={calculatedPrice}
                  originalPrice={originalPrice}
                  isSelected={isSelected}
                  isBestPrice={isBestPrice}
                  currencySymbol={currencySymbol}
                  handleVehicleSelect={handleVehicleSelect}
                  t={t}
                />
              );
            })}
          </div>
  );
}
