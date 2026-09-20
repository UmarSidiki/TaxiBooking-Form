"use client";

import { useCallback, useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { FormData, FormErrors } from "@/contexts/BookingFormContext";
import { MIN_POLYGON_POINTS } from "@/lib/maps/map-defaults";
import type { ISetting } from "@/models/settings";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function useStep1StopAutocomplete({
  formData,
  settings,
  stopInputRefs,
  validatePlaceInBounds,
  setErrors,
  setFormData,
  t,
}: {
  formData: FormData;
  settings: Partial<ISetting> | null | undefined;
  stopInputRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  validatePlaceInBounds: (place: google.maps.places.PlaceResult) => boolean;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  setFormData: Dispatch<SetStateAction<FormData>>;
  t: TFn;
}) {
  const setupStopAutocomplete = useCallback(
    (index: number) => {
      if (!window.google || !window.google.maps || !window.google.maps.places)
        return null;

      const inputRef = stopInputRefs.current[index];
      if (!inputRef) return null;

      const autocompleteOptions: google.maps.places.AutocompleteOptions = {
        strictBounds: true,
      };

      // If polygon is defined, use its bounding box for biasing results
      if (settings?.mapPolygonPoints && settings.mapPolygonPoints.length >= MIN_POLYGON_POINTS) {
        const bounds = new google.maps.LatLngBounds();
        settings.mapPolygonPoints.forEach(point => {
          bounds.extend(new google.maps.LatLng(point.lat, point.lng));
        });
        autocompleteOptions.bounds = bounds;
      } else if (settings?.mapBounds) {
        // Fallback to rectangular bounds if available
        const bounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(settings.mapBounds.south, settings.mapBounds.west),
          new google.maps.LatLng(settings.mapBounds.north, settings.mapBounds.east)
        );
        autocompleteOptions.bounds = bounds;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef,
        autocompleteOptions
      );

      const listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        
        console.log("Stop autocomplete - settings available:", {
          hasPolygon: !!settings?.mapPolygonPoints,
          polygonLength: settings?.mapPolygonPoints?.length
        });
        
        // Validate against polygon bounds if defined
        if (!validatePlaceInBounds(place)) {
          inputRef.value = "";
          setErrors((prev) => ({
            ...prev,
            stops: t("Step1.location-outside-service-area"),
          }));
          return;
        }

        const newLocation = place.formatted_address || place.name || "";
        setFormData((prev) => ({
          ...prev,
          stops: prev.stops.map((stop, i) =>
            i === index ? { ...stop, location: newLocation } : stop
          ),
        }));
        // Distance calculation will be triggered by the useEffect that monitors stops
      });

      // Return cleanup function
      return () => {
        if (listener) {
          google.maps.event.removeListener(listener);
        }
      };
    },
    [setFormData, settings?.mapPolygonPoints, settings?.mapBounds, validatePlaceInBounds, setErrors, t]
  );

  // Effect to setup autocomplete for stops when they change
  useEffect(() => {
    if (formData.stops.length === 0) {
      return;
    }

    const lastIndex = formData.stops.length - 1;
    if (stopInputRefs.current[lastIndex]) {
      const cleanup = setupStopAutocomplete(lastIndex);
      // Return cleanup function
      return cleanup || undefined;
    }
  }, [formData.stops.length, setupStopAutocomplete]);
}
