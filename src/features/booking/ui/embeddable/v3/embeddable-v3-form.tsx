"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import "@/style/EmbeddableLayout.css";
import { Card } from "@/components/ui/card";
import { useStep1 } from "@/hooks/form/form-steps/useStep1";
import { useBookingStops } from "@/hooks/form/useBookingStops";
import { useIframeBodyResize } from "@/hooks/embeddable/useIframeBodyResize";
import { useTranslations } from "next-intl";
import { useBookingForm } from "@/contexts/BookingFormContext";
import { EmbeddableV3TypeFields } from "./embeddable-v3-type-fields";
import { EmbeddableV3LocationFields } from "./embeddable-v3-location-fields";
import { EmbeddableV3ScheduleFields } from "./embeddable-v3-schedule-fields";
import { EmbeddableV3Submit } from "./embeddable-v3-submit";

export function EmbeddableV3Form() {
  const t = useTranslations();
  const { setFormData } = useBookingForm();
  const {
    pickupInputRef,
    dropoffInputRef,
    stopInputRefs,
    formData,
    errors,
    calculatingDistance,
    isLoading,
    redirectToStep2,
    handleBookingTypeChange,
    handleInputChange,
    handleInputBlur,
  } = useStep1();

  // Get today's date in YYYY-MM-DD format for minDate
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  // Check if booking type is hourly
  const isHourly = formData.bookingType === "hourly";

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    redirectToStep2();
  };

  // Helper functions for updating specific form fields
  const setBookingType = (type: "destination" | "hourly") => {
    handleBookingTypeChange(type);
  };

  const setPassengers = (passengers: number) => {
    if (passengers === 0 || isNaN(passengers)) {
      return;
    }
    handleInputChange("passengers", passengers);
  };

  // For the isMounted state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useIframeBodyResize();

  const {
    handleAddStop,
    handleRemoveStop,
    handleStopChange,
    handleStopDurationChange,
  } = useBookingStops(formData, setFormData);

  return (
    <div
      className={`font-sans transition-all duration-75 ease-out w-full h-full overflow-auto ${
        isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      <Card className="rounded-xl bg-white p-3 sm:p-4 md:p-5 border-0 shadow-sm w-full h-full min-h-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-3 sm:space-y-4">
          {/* Booking Type Toggle */}
          <EmbeddableV3TypeFields
            t={t}
            isHourly={isHourly}
            setBookingType={setBookingType}
          />

          {/* Form Fields Container */}
          <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3">
            <EmbeddableV3LocationFields
              t={t}
              formData={formData}
              errors={errors}
              isHourly={isHourly}
              pickupInputRef={pickupInputRef}
              dropoffInputRef={dropoffInputRef}
              stopInputRefs={stopInputRefs}
              handleInputChange={handleInputChange}
              handleInputBlur={handleInputBlur}
              handleAddStop={handleAddStop}
              handleRemoveStop={handleRemoveStop}
              handleStopChange={handleStopChange}
              handleStopDurationChange={handleStopDurationChange}
            />
            <EmbeddableV3ScheduleFields
              t={t}
              formData={formData}
              errors={errors}
              minDate={minDate}
              handleInputChange={handleInputChange}
              handleInputBlur={handleInputBlur}
              setPassengers={setPassengers}
            />
          </div>

          {/* Submit Button */}
          <EmbeddableV3Submit
            t={t}
            isLoading={isLoading}
            calculatingDistance={calculatingDistance}
          />
        </form>
      </Card>
    </div>
  );
}
