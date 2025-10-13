// hooks/useBookingForm.ts
import { useState, useEffect, useRef } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { FormData, FormErrors } from "@/contexts/BookingFormContext";
import { useTranslations } from "next-intl";

const initialFormData: FormData = {
  bookingType: "destination",
  pickup: "",
  dropoff: "",
  tripType: "oneway",
  duration: 2,
  date: "",
  time: "",
  passengers: 1,
  selectedVehicle: "",
  childSeats: 0,
  babySeats: 0,
  notes: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

export const useBookingForm = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();

  const isHourly = formData.bookingType === "hourly";

  // Get today's date in YYYY-MM-DD format for min date constraint
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = getTodayDate();

  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Make body tag bg transparent forcefully
  useEffect(() => {
    const body = document.body;
    body.style.backgroundColor = "transparent";
    return () => {
      body.style.backgroundColor = "";
    };
  }, []);

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    const initAutocomplete = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;
      try {
        setOptions({ key: apiKey, v: "weekly" });
        const places = await importLibrary("places");
        const options = {
          componentRestrictions: { country: ["ch", "fr", "de", "it"] },
        };

        if (pickupInputRef.current) {
          const autocompletePickup = new places.Autocomplete(
            pickupInputRef.current,
            options
          );
          autocompletePickup.addListener("place_changed", () => {
            const place = autocompletePickup.getPlace();
            const newPickup = place.formatted_address || place.name || "";
            setFormData((prev) => ({ ...prev, pickup: newPickup }));
            setErrors((prev) => ({ ...prev, pickup: undefined }));
          });
        }
        if (dropoffInputRef.current) {
          const autocompleteDropoff = new places.Autocomplete(
            dropoffInputRef.current,
            options
          );
          autocompleteDropoff.addListener("place_changed", () => {
            const place = autocompleteDropoff.getPlace();
            const newDropoff = place.formatted_address || place.name || "";
            setFormData((prev) => ({ ...prev, dropoff: newDropoff }));
            setErrors((prev) => ({ ...prev, dropoff: undefined }));
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };
    initAutocomplete();
  }, []);

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!formData.pickup.trim())
      nextErrors.pickup = t('embeddable.pickup-location-is-required');
    if (!isHourly && !formData.dropoff.trim())
      nextErrors.dropoff = t('embeddable.destination-is-required');
    if (!formData.date) nextErrors.date = t('embeddable.date-is-required');
    if (!formData.time) nextErrors.time = t('embeddable.time-is-required');
    
    // Validate that date is not in the past
    if (formData.date && formData.date < minDate) {
      nextErrors.date = t('embeddable.date-cannot-be-in-the-past');
    }
    
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createTargetUrl = () => {
    const params = new URLSearchParams({
      step: "2",
      bookingType: formData.bookingType,
      pickup: formData.pickup.trim(),
      date: formData.date,
      time: formData.time,
      passengers: String(formData.passengers),
      source: "embed_v1",
    });

    // Add dropoff and tripType only for destination bookings
    if (!isHourly) {
      params.set("dropoff", formData.dropoff.trim());
      params.set(
        "tripType",
        formData.tripType === "roundtrip" ? "return" : "oneway"
      );
    }

    // Add duration only for hourly bookings
    if (isHourly) {
      params.set("duration", String(formData.duration));
    }

    // Return the URL with parameters
    return `?${params.toString()}`;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    const targetUrl = createTargetUrl();
    const fullUrl = `${window.location.origin}${targetUrl}`;

    // Check if we're in an iframe and redirect parent window
    try {
      if (window.top && window.top !== window.self) {
        // We're in an iframe, try to redirect the parent window
        window.top.location.href = fullUrl;
      } else {
        // We're not in an iframe, redirect normally
        window.location.href = fullUrl;
      }
    } catch {
      // Fallback for cross-origin or security errors: open in new tab
      window.open(fullUrl, "_blank");
    }
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const setBookingType = (type: "destination" | "hourly") => {
    setFormData(prev => ({
      ...prev,
      bookingType: type,
      dropoff: type === "hourly" ? "" : prev.dropoff,
    }));
  };

  const setTripType = (type: "oneway" | "roundtrip") => {
    setFormData(prev => ({ ...prev, tripType: type }));
  };

  const setDuration = (duration: number) => {
    setFormData(prev => ({
      ...prev,
      duration: Math.max(1, duration),
    }));
  };

  const setPassengers = (passengers: number) => {
    setFormData(prev => ({
      ...prev,
      passengers: Math.min(8, Math.max(1, passengers)),
    }));
  };

  const progressSteps = [
    { label: t("embeddable.trip"), icon: "MapPin" },
    { label: t('embeddable.vehicle'), icon: "Car" },
    { label: t('embeddable.payment'), icon: "CheckCircle" },
  ];

  return {
    // State
    isMounted,
    focusedField,
    formData,
    errors,
    isSubmitting,
    isHourly,
    progressSteps,
    minDate, // Expose minDate to the UI component
    
    // Refs
    pickupInputRef,
    dropoffInputRef,
    
    // Actions
    setFocusedField,
    handleSubmit,
    updateFormData,
    setBookingType,
    setTripType,
    setDuration,
    setPassengers,
  };
};