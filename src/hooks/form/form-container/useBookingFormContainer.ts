"use client";

import { useEffect, useState } from "react";
import { useBookingForm } from "@/contexts/BookingFormContext";
import { useSearchParams } from "next/navigation";
import type { FormData } from "@/contexts/BookingFormContext";
import { useTranslations } from "next-intl";

export function useBookingFormContainer() {
  const { currentStep, setCurrentStep, setFormData } = useBookingForm();
  const t = useTranslations();

  // Prevent flash of default step when deep linking
  const [initialized, setInitialized] = useState(false);
  const searchParams = useSearchParams();

  // Prefill form data and set step based on URL parameters
  useEffect(() => {
    const params = searchParams;
    const stepRaw = params.get("step");
    const sourceRaw = params.get("source");
    const bookingRaw = params.get("bookingType") ?? params.get("bookingtype");
    const pickupRaw = params.get("pickup");
    const dropoffRaw = params.get("dropoff");
    const dateRaw = params.get("date");
    const timeRaw = params.get("time");
    const paxRaw = params.get("passengers");
    const tripRaw = params.get("tripType") ?? params.get("triptype");
    const durationRaw = params.get("duration") ?? params.get("hours");

    // Build updates
    const updates: Partial<FormData> = {};
    if (bookingRaw === "destination" || bookingRaw === "hourly") {
      updates.bookingType = bookingRaw as "destination" | "hourly";
      if (bookingRaw === "hourly") updates.dropoff = "";
    }
    if (pickupRaw) updates.pickup = pickupRaw;
    if (dropoffRaw && updates.bookingType !== "hourly")
      updates.dropoff = dropoffRaw;
    if (dateRaw) updates.date = dateRaw;
    if (timeRaw) updates.time = timeRaw;
    if (paxRaw) updates.passengers = parseInt(paxRaw, 10) || 1;
    // Only accept 'oneway' or 'return' (mapped to 'roundtrip')
    if (tripRaw === "oneway" || tripRaw === "return") {
      updates.tripType = tripRaw === "return" ? "roundtrip" : "oneway";
    }
    if (bookingRaw === "hourly" && durationRaw) {
      const d = parseInt(durationRaw, 10);
      if (!isNaN(d) && d > 0) updates.duration = d;
    }

    const hasUpdates = Object.keys(updates).length > 0;
    const shouldDetermineStep = hasUpdates || !!stepRaw || !!sourceRaw;

    if (hasUpdates) {
      setFormData((prev) => ({ ...prev, ...updates }));
    }

    if (shouldDetermineStep) {
      if (stepRaw && ["1", "2", "3"].includes(stepRaw)) {
        setCurrentStep(parseInt(stepRaw, 10) as 1 | 2 | 3);
      } else if (sourceRaw === "embed_v1") {
        setCurrentStep(2);
      } else if (hasUpdates) {
        setCurrentStep(2);
      }
    }
    // Mark initialization complete after processing params
    setInitialized(true);
  }, [searchParams, setFormData, setCurrentStep]);

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return t("FormContainer.trip-details");
      case 2:
        return t("FormContainer.select-vehicle");
      case 3:
        return t("FormContainer.payment-and-details");
      default:
        return t("FormContainer.booking");
    }
  };

  return {
    // State
    initialized,
    currentStep,

    // Functions
    getStepTitle,
  };
}
