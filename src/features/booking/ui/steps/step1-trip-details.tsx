"use client";

import { memo } from "react";
import type { ChangeEvent } from "react";
import { useBookingStops } from "@/hooks/form/useBookingStops";
import { useStep1 } from "@/hooks/form/form-steps/useStep1";
import { useTranslations } from "next-intl";
import {
  MAX_PASSENGERS,
  MIN_PASSENGERS,
} from "@/lib/form/passenger-limits";
import { Step1BookingTypeFields } from "./step1-booking-type-fields";
import { Step1DurationTripTypeFields } from "./step1-duration-trip-type-fields";
import { Step1Footer } from "./step1-footer";
import { Step1LocationFields } from "./step1-location-fields";
import { Step1MapPanel } from "./step1-map-panel";
import { Step1ScheduleFields } from "./step1-schedule-fields";

function Step1TripDetails() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const {
    // State
    mapLoaded,
    mapRef,
    pickupInputRef,
    dropoffInputRef,
    stopInputRefs,

    // Context values
    formData,
    setFormData,
    errors,
    distanceData,
    calculatingDistance,
    isLoading,

    // Functions
    handleBookingTypeChange,
    handleTripTypeChange,
    handleInputChange,
    handleInputBlur,
    handleNext,
  } = useStep1();

  const t = useTranslations();

  // Handle passenger input change - simplified logic
  const handlePassengerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty string for clearing the field
    if (value === "") {
      setFormData((prev) => ({ ...prev, passengers: 0 }));
      return;
    }

    // Only update form data if it's a valid number
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= MIN_PASSENGERS && numValue <= MAX_PASSENGERS) {
      handleInputChange("passengers", numValue);
    }
  };

  // Handle passenger input blur - simplified logic
  const handlePassengerBlur = () => {
    const currentValue = Number(formData.passengers);
    if (isNaN(currentValue) || currentValue < MIN_PASSENGERS) {
      handleInputChange("passengers", MIN_PASSENGERS);
    } else {
      // Ensure the value is within bounds
      const numValue = Math.min(MAX_PASSENGERS, Math.max(MIN_PASSENGERS, currentValue));
      handleInputChange("passengers", numValue);
    }
  };

  const {
    handleAddStop,
    handleRemoveStop,
    handleStopChange,
    handleStopDurationChange,
  } = useBookingStops(formData, setFormData);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
      <Step1MapPanel
        t={t}
        mapRef={mapRef}
        mapLoaded={mapLoaded}
        distanceData={distanceData}
        formData={formData}
      />

      {/* Form Section - Right Side */}
      <div className="lg:col-span-4 bg-white p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">{t("Step1.Title")}</h2>
            <p className="text-sm text-gray-600">{t("Step1.Description")}</p>
          </div>

          <Step1BookingTypeFields
            t={t}
            formData={formData}
            handleBookingTypeChange={handleBookingTypeChange}
          />

          <Step1LocationFields
            t={t}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            pickupInputRef={pickupInputRef}
            dropoffInputRef={dropoffInputRef}
            stopInputRefs={stopInputRefs}
            handleInputBlur={handleInputBlur}
            handleAddStop={handleAddStop}
            handleRemoveStop={handleRemoveStop}
            handleStopChange={handleStopChange}
            handleStopDurationChange={handleStopDurationChange}
            calculatingDistance={calculatingDistance}
          />

          <Step1DurationTripTypeFields
            t={t}
            formData={formData}
            handleInputChange={handleInputChange}
            handleInputBlur={handleInputBlur}
            handleTripTypeChange={handleTripTypeChange}
          />

          <Step1ScheduleFields
            t={t}
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleInputBlur={handleInputBlur}
            handlePassengerChange={handlePassengerChange}
            handlePassengerBlur={handlePassengerBlur}
            today={today}
          />

          <Step1Footer
            t={t}
            isLoading={isLoading}
            calculatingDistance={calculatingDistance}
            handleNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(Step1TripDetails);
