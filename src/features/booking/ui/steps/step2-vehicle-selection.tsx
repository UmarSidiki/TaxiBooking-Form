"use client";

import { memo, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useStep2 } from "@/features/booking/hooks/form-steps/useStep2";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/shared/context/currency-context";
import { Step2Map } from "./step2-map";
import { Step2TripSummary } from "./step2-trip-summary";
import { Step2VehicleList } from "./step2-vehicle-list";

function Step2VehicleSelection() {
  const {
    // State
    mapLoaded,
    mapRef,

    // Context values
    formData,
    vehicles,
    distanceData,

    // Tax settings
    enableTax,
    taxPercentage,
    taxIncluded,

    // Functions
    calculatePrice,
    calculateOriginalPrice,
    handleVehicleSelect,
    handleBack,
    calculatingDistance,
  } = useStep2();

  const { currencySymbol } = useCurrency();

  const t = useTranslations();

  // Sort vehicles by calculated price (lowest first) - memoized for performance
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      const priceA = calculatePrice(a);
      const priceB = calculatePrice(b);
      return priceA - priceB;
    });
  }, [vehicles, calculatePrice]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Vehicle Selection */}
      <div className="lg:col-span-2 space-y-4">
        {/* Map Section */}
        <Step2Map mapRef={mapRef} mapLoaded={mapLoaded} />

        <div>
          <h2 className="text-xl font-semibold mb-2">
            {t("Step2.select-your-vehicle")}
          </h2>
          <p className="text-gray-600 text-sm">
            {t("Step2.choose-the-perfect-vehicle-for-your-journey")}
          </p>
        </div>

        <Step2VehicleList
          vehicles={vehicles}
          sortedVehicles={sortedVehicles}
          formData={formData}
          distanceData={distanceData}
          calculatingDistance={calculatingDistance}
          calculatePrice={calculatePrice}
          calculateOriginalPrice={calculateOriginalPrice}
          currencySymbol={currencySymbol}
          handleVehicleSelect={handleVehicleSelect}
          t={t}
        />

        <Button onClick={handleBack} variant="outline" className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />{" "}
          {t("Step2.back-to-trip-details")}
        </Button>
      </div>

      {/* Sidebar - Trip Summary */}
      <Step2TripSummary
        formData={formData}
        vehicles={vehicles}
        distanceData={distanceData}
        calculatePrice={calculatePrice}
        enableTax={enableTax}
        taxPercentage={taxPercentage}
        taxIncluded={taxIncluded}
        currencySymbol={currencySymbol}
        t={t}
      />
    </div>
  );
}

export default memo(Step2VehicleSelection);
