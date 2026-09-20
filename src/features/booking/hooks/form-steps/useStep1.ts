"use client";

import { useState, useCallback, useRef } from "react";
import { useBookingForm } from "@/features/booking/context/booking-form-context";
import { useTheme } from "@/features/settings/context/theme-context";
import { useTranslations } from "next-intl";
import { isPlaceInServiceArea } from "@/features/booking/lib/maps/is-place-in-service-area";
import { useStep1Distance } from "@/features/booking/hooks/form-steps/useStep1Distance";
import { useStep1GoogleMaps } from "@/features/booking/hooks/form-steps/useStep1GoogleMaps";
import { useStep1StopAutocomplete } from "@/features/booking/hooks/form-steps/useStep1StopAutocomplete";
import { getStep1Errors } from "@/features/booking/lib/get-step1-errors";
import { createStep1EmbedUrl } from "@/features/booking/lib/create-step1-embed-url";
import { navigateEmbedToStep2 } from "@/features/booking/lib/navigate-embed-to-step2";

export function useStep1() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null
  );

  const {
    formData,
    setFormData,
    errors,
    setErrors,
    distanceData,
    setDistanceData,
    calculatingDistance,
    setCalculatingDistance,
    setCurrentStep,
    isLoading,
  } = useBookingForm();

  const t = useTranslations();
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  const stopInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { settings } = useTheme();
  const pickupAutocompleteListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const dropoffAutocompleteListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const validatePlaceInBounds = useCallback(
    (place: google.maps.places.PlaceResult): boolean => {
      return isPlaceInServiceArea(place, settings?.mapPolygonPoints);
    },
    [settings?.mapPolygonPoints]
  );

  useStep1StopAutocomplete({
    formData,
    settings,
    stopInputRefs,
    validatePlaceInBounds,
    setErrors,
    setFormData,
    t,
  });

  const { calculateDistance, handleInputBlur } = useStep1Distance({
    formData,
    googleMapRef,
    directionsRendererRef,
    setDistanceData,
    setCalculatingDistance,
  });

  useStep1GoogleMaps({
    mapRef,
    googleMapRef,
    directionsRendererRef,
    pickupInputRef,
    dropoffInputRef,
    pickupAutocompleteListenerRef,
    dropoffAutocompleteListenerRef,
    settings,
    formData,
    validatePlaceInBounds,
    setErrors,
    setFormData,
    setMapLoaded,
    calculateDistance,
    t,
  });

  const validateStep = (): boolean => {
    const newErrors = getStep1Errors(formData, t);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const redirectToStep2 = () => {
    if (validateStep()) {
      // Persist step change before navigating away so the main form opens on step 2
      setCurrentStep(2);

      // Only persist to sessionStorage if not in iframe (since main form will handle it)
      const isEmbedded =
        typeof window !== "undefined" && window.self !== window.top;
      if (!isEmbedded) {
        try {
          sessionStorage.setItem("booking_form_step", "2");
        } catch (error) {
          console.debug("Unable to persist step to sessionStorage", error);
        }
      }

      const targetUrl = createStep1EmbedUrl(formData);
      const fullUrl = `${window.location.origin}${targetUrl}`;
      navigateEmbedToStep2(fullUrl);
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(2);
    }
  };

  const handleBookingTypeChange = (bookingType: "destination" | "hourly") => {
    setFormData((prev) => ({
      ...prev,
      bookingType,
      dropoff: bookingType === "hourly" ? "" : prev.dropoff,
    }));
  };

  const handleTripTypeChange = (tripType: "oneway" | "roundtrip") => {
    setFormData((prev) => ({ ...prev, tripType }));
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return {
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
    validateStep,
    handleNext,
    redirectToStep2, // New function for redirecting to step 2
    setCurrentStep,
    handleBookingTypeChange,
    handleTripTypeChange,
    handleInputChange,
    handleInputBlur,
  };
}
