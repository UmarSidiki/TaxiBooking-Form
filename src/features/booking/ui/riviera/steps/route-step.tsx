"use client";

import { memo } from "react";
import { useBookingStops } from "@/features/booking/hooks/useBookingStops";
import { useStep1 } from "@/features/booking/hooks/form-steps/useStep1";
import { useTranslations } from "next-intl";
import { Step1BookingTypeFields } from "../../steps/step1-booking-type-fields";
import { Step1DurationTripTypeFields } from "../../steps/step1-duration-trip-type-fields";
import { Step1Footer } from "../../steps/step1-footer";
import { Step1LocationFields } from "../../steps/step1-location-fields";
import { Step1ScheduleFields } from "../../steps/step1-schedule-fields";

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

  const {
    handleAddStop,
    handleRemoveStop,
    handleStopChange,
    handleStopDurationChange,
  } = useBookingStops(formData, setFormData);

  return (
    <div className="step1 space-y-4">
      <div className="step1__stack space-y-4">
          <div>
            <h2 className="step1__title text-xl font-semibold mb-2">{t("Step1.Title")}</h2>
            <p className="step1__lede text-sm text-[color:var(--ink2)]">{t("Step1.Description")}</p>
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
  );
}

export default memo(Step1TripDetails);
