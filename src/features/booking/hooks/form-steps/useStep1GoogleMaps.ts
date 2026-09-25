"use client";

import { useEffect } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_LOAD_DEFER_MS,
} from "@/features/booking/lib/maps/map-defaults";
import { buildAutocompleteOptions } from "@/features/booking/lib/maps/place-autocomplete";
import type { FormData, FormErrors } from "@/features/booking/context/booking-form-context";
import type { ISetting } from "@/features/settings/model";
import { useTranslations } from "next-intl";
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";

export function useStep1GoogleMaps({
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
}: {
  mapRef: RefObject<HTMLDivElement | null>;
  googleMapRef: MutableRefObject<google.maps.Map | null>;
  directionsRendererRef: MutableRefObject<google.maps.DirectionsRenderer | null>;
  pickupInputRef: RefObject<HTMLInputElement | null>;
  dropoffInputRef: RefObject<HTMLInputElement | null>;
  pickupAutocompleteListenerRef: MutableRefObject<google.maps.MapsEventListener | null>;
  dropoffAutocompleteListenerRef: MutableRefObject<google.maps.MapsEventListener | null>;
  settings: Partial<ISetting> | null | undefined;
  formData: FormData;
  validatePlaceInBounds: (place: google.maps.places.PlaceResult) => boolean;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  setFormData: Dispatch<SetStateAction<FormData>>;
  setMapLoaded: Dispatch<SetStateAction<boolean>>;
  calculateDistance: (
    origin: string,
    destination: string,
    stops: Array<{ location: string; order: number }>,
    isRoundTrip: boolean,
  ) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  // Initialize Google Maps and Autocomplete - deferred until needed
  useEffect(() => {
    // Defer loading for performance
    const timeoutId = setTimeout(async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("Google Maps API key not configured");
        setMapLoaded(true); // Still mark as loaded to remove loader
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

        // Initialize map (only if map container is present)
        if (mapRef.current && !googleMapRef.current) {
          const initialCenter =
            settings && settings.mapInitialLat && settings.mapInitialLng
              ? { lat: settings.mapInitialLat, lng: settings.mapInitialLng }
              : DEFAULT_MAP_CENTER; // Default to Geneva

          googleMapRef.current = new maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: DEFAULT_MAP_ZOOM,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          setMapLoaded(true);
        }

        const autocompleteOptions = buildAutocompleteOptions(settings);

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

          pickupAutocompleteListenerRef.current = autocompletePickup.addListener("place_changed", () => {
            const place = autocompletePickup.getPlace();
            
            console.log("Pickup autocomplete - settings available:", {
              hasPolygon: !!settings?.mapPolygonPoints,
              polygonLength: settings?.mapPolygonPoints?.length
            });
            
            // Validate against polygon bounds if defined
            if (!validatePlaceInBounds(place)) {
              if (pickupInputRef.current) pickupInputRef.current.value = "";
              setErrors((prev) => ({
                ...prev,
                pickup: t("Step1.location-outside-service-area"),
              }));
              return;
            }

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

          dropoffAutocompleteListenerRef.current = autocompleteDropoff.addListener("place_changed", () => {
            const place = autocompleteDropoff.getPlace();
            
            // Validate against polygon bounds if defined
            if (!validatePlaceInBounds(place)) {
              if (dropoffInputRef.current) dropoffInputRef.current.value = "";
              setErrors((prev) => ({
                ...prev,
                dropoff: t("Step1.location-outside-service-area"),
              }));
              return;
            }

            const newDropoff = place.formatted_address || place.name || "";
            setFormData((prev) => ({ ...prev, dropoff: newDropoff }));
            // Distance calculation will be triggered by the useEffect
          });
        }

        // If we have pickup and dropoff from context, show the route (only on initial load)
        // Only try to calculate distance if we have a map to display it on
        if (
          mapRef.current &&
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
    }, MAP_LOAD_DEFER_MS); // 300ms delay to prioritize initial render

    return () => {
      clearTimeout(timeoutId);
      // Cleanup autocomplete listeners to prevent memory leaks
      if (pickupAutocompleteListenerRef.current) {
        google.maps.event.removeListener(pickupAutocompleteListenerRef.current);
        pickupAutocompleteListenerRef.current = null;
      }
      if (dropoffAutocompleteListenerRef.current) {
        google.maps.event.removeListener(dropoffAutocompleteListenerRef.current);
        dropoffAutocompleteListenerRef.current = null;
      }
    };
  }, []); // Run only once on mount


}
