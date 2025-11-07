"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useBookingForm } from "@/contexts/BookingFormContext";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslations } from "next-intl";

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
  const formDataRef = useRef(formData);
  const { settings } = useTheme();
  const distanceCalculationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const setupStopAutocomplete = useCallback(
    (index: number) => {
      if (!window.google || !window.google.maps || !window.google.maps.places)
        return;

      const inputRef = stopInputRefs.current[index];
      if (!inputRef) return;

      const autocompleteOptions = {
        componentRestrictions: settings?.mapCountryRestrictions?.length
          ? { country: settings.mapCountryRestrictions }
          : undefined,
      };

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef,
        autocompleteOptions
      );
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const newLocation = place.formatted_address || place.name || "";
        setFormData((prev) => ({
          ...prev,
          stops: prev.stops.map((stop, i) =>
            i === index ? { ...stop, location: newLocation } : stop
          ),
        }));
        // Distance calculation will be triggered by the useEffect that monitors stops
      });
    },
    [settings, setFormData]
  );

  const calculateDistance = useCallback(
    async (
      origin: string,
      destination: string,
      stops: Array<{ location: string; order: number }> = [],
      isRoundTrip: boolean = false
    ) => {
      if (!origin || !destination) return;

      setCalculatingDistance(true);
      try {
        const stopLocations = stops
          .map((stop) => stop.location)
          .filter((location) => location.trim());
        const response = await fetch("/api/distance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin,
            destination,
            stops: stopLocations,
            isRoundTrip,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setDistanceData(data.data);

          // Update map route
          if (googleMapRef.current && window.google) {
            const directionsService = new google.maps.DirectionsService();

            const waypoints = stopLocations.map((location) => ({
              location: location,
              stopover: true,
            }));

            directionsService.route(
              {
                origin: origin,
                destination: destination,
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (result, status) => {
                if (status === "OK" && result) {
                  if (!directionsRendererRef.current) {
                    directionsRendererRef.current =
                      new google.maps.DirectionsRenderer({
                        map: googleMapRef.current,
                        suppressMarkers: false,
                        polylineOptions: {
                          strokeColor: "var(--primary-color)",
                          strokeWeight: 4,
                        },
                      });
                  }
                  directionsRendererRef.current.setDirections(result);
                }
              }
            );
          }
        }
      } catch (error) {
        console.error("Error calculating distance:", error);
      } finally {
        setCalculatingDistance(false);
      }
    },
    [setCalculatingDistance, setDistanceData]
  );

  // Debounced distance calculation to prevent excessive API calls
  const debouncedCalculateDistance = useCallback(
    (
      origin: string,
      destination: string,
      stops: Array<{ location: string; order: number }> = [],
      isRoundTrip: boolean = false
    ) => {
      // Clear existing timer
      if (distanceCalculationTimerRef.current) {
        clearTimeout(distanceCalculationTimerRef.current);
      }

      // Set new timer
      distanceCalculationTimerRef.current = setTimeout(() => {
        calculateDistance(origin, destination, stops, isRoundTrip);
      }, 500); // 500ms debounce
    },
    [calculateDistance]
  );

  // Effect to setup autocomplete for stops when they change
  useEffect(() => {
    if (formData.stops.length === 0) {
      return;
    }

    const lastIndex = formData.stops.length - 1;
    if (stopInputRefs.current[lastIndex]) {
      setupStopAutocomplete(lastIndex);
    }
  }, [formData.stops.length, setupStopAutocomplete]);

  // Effect to recalculate distance when stops change
  // Using useMemo to prevent unnecessary recalculations
  const stopsKey = useMemo(
    () => formData.stops.map(s => s.location).join('|'),
    [formData.stops]
  );

  useEffect(() => {
    // Only recalculate if we have pickup and dropoff
    if (formData.pickup && formData.dropoff && formData.bookingType === "destination") {
      // Only recalculate if all stops have locations (or no stops)
      const allStopsValid = formData.stops.length === 0 || 
        formData.stops.every(stop => stop.location.trim());
      
      if (allStopsValid) {
        debouncedCalculateDistance(
          formData.pickup,
          formData.dropoff,
          formData.stops,
          formData.tripType === "roundtrip"
        );
      }
    }
  }, [
    formData.pickup,
    formData.dropoff,
    formData.bookingType,
    formData.tripType,
    formData.stops,
    stopsKey, // Use memoized key instead of inline calculation
    debouncedCalculateDistance,
  ]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (distanceCalculationTimerRef.current) {
        clearTimeout(distanceCalculationTimerRef.current);
      }
    };
  }, []);

  // Initialize Google Maps ONCE
  useEffect(() => {
    const initGoogleMaps = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("Google Maps API key not configured");
        return;
      }

      try {
        setOptions({
          key: apiKey,
          v: "weekly",
        });

        const [maps, places] = await Promise.all([
          importLibrary("maps"),
          importLibrary("places"),
        ]);

        // Initialize map
        if (mapRef.current && !googleMapRef.current) {
          const initialCenter =
            settings && settings.mapInitialLat && settings.mapInitialLng
              ? { lat: settings.mapInitialLat, lng: settings.mapInitialLng }
              : { lat: 46.2044, lng: 6.1432 }; // Default to Geneva

          googleMapRef.current = new maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 8,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          setMapLoaded(true);
        }

        const autocompleteOptions = {
          componentRestrictions: settings?.mapCountryRestrictions?.length
            ? { country: settings.mapCountryRestrictions }
            : undefined,
        };

        // Setup Autocomplete for pickup (only once)
        if (
          pickupInputRef.current &&
          !pickupInputRef.current.dataset.autocompleteInitialized
        ) {
          pickupInputRef.current.dataset.autocompleteInitialized = "true";
          const autocompletePickup = new places.Autocomplete(
            pickupInputRef.current,
            autocompleteOptions
          );
          autocompletePickup.addListener("place_changed", () => {
            const place = autocompletePickup.getPlace();
            const newPickup = place.formatted_address || place.name || "";
            setFormData((prev) => ({ ...prev, pickup: newPickup }));
            // Distance calculation will be triggered by the useEffect
          });
        }

        // Setup Autocomplete for dropoff (only once)
        if (
          dropoffInputRef.current &&
          !dropoffInputRef.current.dataset.autocompleteInitialized
        ) {
          dropoffInputRef.current.dataset.autocompleteInitialized = "true";
          const autocompleteDropoff = new places.Autocomplete(
            dropoffInputRef.current,
            autocompleteOptions
          );
          autocompleteDropoff.addListener("place_changed", () => {
            const place = autocompleteDropoff.getPlace();
            const newDropoff = place.formatted_address || place.name || "";
            setFormData((prev) => ({ ...prev, dropoff: newDropoff }));
            // Distance calculation will be triggered by the useEffect
          });
        }

        // If we have pickup and dropoff from context, show the route (only on initial load)
        if (
          formData.pickup &&
          formData.dropoff &&
          !directionsRendererRef.current
        ) {
          calculateDistance(
            formData.pickup,
            formData.dropoff,
            formData.stops,
            formData.tripType === "roundtrip"
          );
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    // Only initialize once when settings are available
    if (settings && !googleMapRef.current) {
      initGoogleMaps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]); // Only run when settings change, not on every formData change

  const validateStep = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.pickup.trim()) {
      newErrors.pickup = t("Step1.pickup-location-is-required");
    }

    // Dropoff is only required for destination-based bookings
    if (formData.bookingType === "destination" && !formData.dropoff.trim()) {
      newErrors.dropoff = t("Step1.dropoff-location-is-required");
    }

    if (!formData.date) {
      newErrors.date = t("Step1.date-is-required");
    }
    if (!formData.time) {
      newErrors.time = t("Step1.time-is-required");
    }

    // Validate return date/time for roundtrip bookings
    if (formData.tripType === "roundtrip") {
      if (!formData.returnDate) {
        newErrors.returnDate = t("Step1.return-date-is-required");
      } else if (formData.date && formData.returnDate < formData.date) {
        newErrors.returnDate = t("Step1.return-date-must-be-after-departure");
      }
      if (!formData.returnTime) {
        newErrors.returnTime = t("Step1.return-time-is-required");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createTargetUrl = () => {
    const locale = window.location.pathname.split("/")[1]; // Extract locale from URL path
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
    if (formData.bookingType === "destination") {
      params.set("dropoff", formData.dropoff.trim());
      params.set(
        "tripType",
        formData.tripType === "roundtrip" ? "return" : "oneway"
      );

      // Add return date/time for roundtrip
      if (formData.tripType === "roundtrip") {
        if (formData.returnDate) params.set("returnDate", formData.returnDate);
        if (formData.returnTime) params.set("returnTime", formData.returnTime);
      }

      // Add stops if they exist
      if (formData.stops.length > 0) {
        const filteredStops = formData.stops.filter((stop) =>
          stop.location.trim()
        );
        if (filteredStops.length > 0) {
          params.set("stops", JSON.stringify(filteredStops));
        }
      }
    }

    // Add duration only for hourly bookings
    if (formData.bookingType === "hourly") {
      params.set("duration", String(formData.duration));
    }

    // Return the URL with locale path and parameters
    return `/${locale}?${params.toString()}`;
  };

  const redirectToStep2 = () => {
    if (validateStep()) {
      // Persist step change before navigating away so the main form opens on step 2
      setCurrentStep(2);

      // Only persist to localStorage if not in iframe (since main form will handle it)
      const isEmbedded =
        typeof window !== "undefined" && window.self !== window.top;
      if (!isEmbedded) {
        try {
          localStorage.setItem("booking_form_step", "2");
        } catch (error) {
          console.debug("Unable to persist step to localStorage", error);
        }
      }

      const targetUrl = createTargetUrl();
      const fullUrl = `${window.location.origin}${targetUrl}`;

      // Always try to break out of iframe by navigating the top window
      try {
        if (window.top && window.top !== window) {
          // We're in an iframe, try to navigate parent
          window.top.location.href = fullUrl;
        } else {
          // We're not in an iframe, navigate normally
          window.location.href = fullUrl;
        }
      } catch (error) {
        // Cross-origin restrictions prevent accessing window.top.location
        // Force navigation with a fallback approach
        console.debug(
          "Cross-origin restriction, using alternative navigation",
          error
        );

        // Try using window.open with _top target as fallback
        try {
          window.open(fullUrl, "_top");
        } catch {
          // Last resort: regular navigation
          window.location.href = fullUrl;
        }
      }
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

  const handleInputBlur = (field: string) => {
    // Trigger distance calculation when both pickup and dropoff are filled
    if (
      (field === "pickup" || field === "dropoff") &&
      formData.pickup &&
      formData.dropoff
    ) {
      debouncedCalculateDistance(
        formData.pickup,
        formData.dropoff,
        formData.stops,
        formData.tripType === "roundtrip"
      );
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
