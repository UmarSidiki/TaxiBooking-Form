"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { FormData, FormErrors } from "@/features/booking/context/booking-form-context";
import { buildAutocompleteOptions } from "@/features/booking/lib/maps/place-autocomplete";
import type { ISetting } from "@/features/settings/model";
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
  // Every stop keeps its own Autocomplete listener; adding another stop must not
  // unbind the ones above it.
  const boundInputsRef = useRef<Set<HTMLInputElement>>(new Set());
  const cleanupsRef = useRef<Map<HTMLInputElement, () => void>>(new Map());

  const setupStopAutocomplete = useCallback(
    (index: number) => {
      if (!window.google || !window.google.maps || !window.google.maps.places)
        return;

      const inputRef = stopInputRefs.current[index];
      if (!inputRef || boundInputsRef.current.has(inputRef)) return;

      boundInputsRef.current.add(inputRef);
      const autocompleteOptions = buildAutocompleteOptions(settings);

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef,
        autocompleteOptions
      );

      const listener = autocomplete.addListener("place_changed", () => {
        // Removing a stop renumbers the ones below it, so the index captured when
        // this listener was bound can be stale. Resolve it against the live refs.
        const currentIndex = stopInputRefs.current.indexOf(inputRef);
        if (currentIndex === -1) return;

        const place = autocomplete.getPlace();

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
        const loc = place.geometry?.location;
        const latLng = loc ? { lat: loc.lat(), lng: loc.lng() } : null;
        setFormData((prev) => ({
          ...prev,
          stops: prev.stops.map((stop, i) =>
            i === currentIndex ? { ...stop, location: newLocation, latLng } : stop
          ),
        }));
        setErrors((prev) => ({ ...prev, stops: undefined }));
        // Distance calculation will be triggered by the useEffect that monitors stops
      });

      cleanupsRef.current.set(inputRef, () => {
        if (listener) {
          window.google?.maps?.event?.removeListener(listener);
        }
      });
    },
    [setFormData, settings?.mapPolygonPoints, settings?.mapBounds, validatePlaceInBounds, setErrors, t]
  );

  // Bind each stop input once, including inputs that arrive after the first render.
  // Inputs React detached (removed stop) are unbound so their listeners cannot
  // outlive the row.
  useEffect(() => {
    for (const [input, cleanup] of cleanupsRef.current) {
      if (input.isConnected) continue;
      cleanup();
      cleanupsRef.current.delete(input);
      boundInputsRef.current.delete(input);
    }

    for (let index = 0; index < formData.stops.length; index += 1) {
      setupStopAutocomplete(index);
    }
  }, [formData.stops.length, setupStopAutocomplete]);

  // Autocomplete lives as long as the step; drop the listeners on unmount.
  useEffect(() => {
    const cleanups = cleanupsRef.current;
    const boundInputs = boundInputsRef.current;
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
      boundInputs.clear();
    };
  }, []);
}
