"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import "@/style/EmbeddableLayout.css";
import { Card } from "@/components/ui/card";
import { useStep1 } from "@/hooks/form/form-steps/useStep1";
import { useBookingStops } from "@/hooks/form/useBookingStops";
import { useIframeBodyResize } from "@/hooks/embeddable/useIframeBodyResize";
import { MIN_PASSENGERS } from "@/lib/form/passenger-limits";
import { useTranslations } from "next-intl";
import { useBookingForm } from "@/contexts/BookingFormContext";
import { EmbeddableV1Progress } from "./embeddable-v1-progress";
import { EmbeddableV1RouteFields } from "./embeddable-v1-route-fields";
import { EmbeddableV1ScheduleFields } from "./embeddable-v1-schedule-fields";
import { EmbeddableV1Submit } from "./embeddable-v1-submit";

export function EmbeddableV1Form() {
  const t = useTranslations();
  const { setFormData } = useBookingForm();
  const {
    mapLoaded,
    mapRef,
    pickupInputRef,
    dropoffInputRef,
    stopInputRefs,
    formData,
    errors,
    calculatingDistance,
    isLoading,
    redirectToStep2,
    handleBookingTypeChange,
    handleTripTypeChange,
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

    // Update the form data if needed
    if (formData.passengers < MIN_PASSENGERS) {
      handleInputChange("passengers", MIN_PASSENGERS);
    }

    // Use redirectToStep2 instead of handleNext
    redirectToStep2();
  };

  // Helper functions for updating specific form fields
  const setBookingType = (type: "destination" | "hourly") => {
    handleBookingTypeChange(type);
  };

  const setTripType = (type: "oneway" | "roundtrip") => {
    handleTripTypeChange(type);
  };

  const setDuration = (duration: number) => {
    handleInputChange("duration", duration);
  };

  const setPassengers = (passengers: number) => {
    // Allow any value including 0 for clearing the field
    handleInputChange("passengers", passengers);
  };

  // For the focused field state
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // For the isMounted state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    handleAddStop,
    handleRemoveStop,
    handleStopChange,
    handleStopDurationChange,
  } = useBookingStops(formData, setFormData);

  useIframeBodyResize();

  return (
    <>
      <div
        className={`font-sans transition-all duration-75 ease-out ${
          isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}
      >
        {/* Map container - only show if map is loaded */}
        {mapLoaded && (
          <div className="mb-3 rounded-lg overflow-hidden h-32 md:h-48">
            <div ref={mapRef} className="w-full h-full" />
          </div>
        )}

        {/* Compact Progress Bar */}
        <EmbeddableV1Progress t={t} />

        {/* Compact Form Card */}
        <Card className="rounded-xl bg-white/90 backdrop-blur-md p-3 border-0 h-full flex flex-col shimmer-container">
          <header className="mb-1 text-center">
            <h1 className="text-base md:text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
              {t("embeddable.trip-booking")}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              {t("embeddable.book-your-ride-in-seconds")}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1">
              <EmbeddableV1RouteFields
                t={t}
                formData={formData}
                errors={errors}
                isHourly={isHourly}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                pickupInputRef={pickupInputRef}
                dropoffInputRef={dropoffInputRef}
                stopInputRefs={stopInputRefs}
                setBookingType={setBookingType}
                setTripType={setTripType}
                setDuration={setDuration}
                handleInputChange={handleInputChange}
                handleInputBlur={handleInputBlur}
                handleAddStop={handleAddStop}
                handleRemoveStop={handleRemoveStop}
                handleStopChange={handleStopChange}
                handleStopDurationChange={handleStopDurationChange}
              >
                <EmbeddableV1ScheduleFields
                  t={t}
                  formData={formData}
                  errors={errors}
                  isHourly={isHourly}
                  minDate={minDate}
                  handleInputChange={handleInputChange}
                  handleInputBlur={handleInputBlur}
                  setPassengers={setPassengers}
                />
              </EmbeddableV1RouteFields>
            </div>

            <EmbeddableV1Submit
              t={t}
              isLoading={isLoading}
              calculatingDistance={calculatingDistance}
            />
          </form>
        </Card>
      </div>
    </>
  );
}
