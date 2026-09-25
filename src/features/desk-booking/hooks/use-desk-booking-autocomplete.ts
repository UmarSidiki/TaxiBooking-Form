"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";

import { isPlaceInServiceArea } from "@/features/booking/lib/maps/is-place-in-service-area";
import {
  buildAutocompleteOptions,
  loadPlacesLibrary,
  type AutocompleteBoundsSettings,
} from "@/features/booking/lib/maps/place-autocomplete";

type AddressHandler = (field: "pickup" | "dropoff", address: string) => void;
type StopHandler = (index: number, address: string) => void;

/**
 * Google Places autocomplete for the desk booking address inputs, restricted to
 * the operator's service area. Attaches once per input element and cleans its
 * listeners up when the drawer unmounts.
 */
export function useDeskBookingAutocomplete({
  open,
  settings,
  pickupRef,
  dropoffRef,
  stopRefs,
  stopCount,
  onAddress,
  onStopAddress,
  onOutsideArea,
}: {
  open: boolean;
  settings: AutocompleteBoundsSettings | null | undefined;
  pickupRef: RefObject<HTMLInputElement | null>;
  dropoffRef: RefObject<HTMLInputElement | null>;
  stopRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  stopCount: number;
  onAddress: AddressHandler;
  onStopAddress: StopHandler;
  onOutsideArea: () => void;
}) {
  const disposersRef = useRef<Array<() => void>>([]);
  const attachedRef = useRef<WeakSet<HTMLInputElement>>(new WeakSet());

  // Keep the latest callbacks/polygon reachable from listeners created earlier.
  const handlersRef = useRef({
    onAddress,
    onStopAddress,
    onOutsideArea,
    polygon: settings?.mapPolygonPoints,
  });

  useEffect(() => {
    handlersRef.current = {
      onAddress,
      onStopAddress,
      onOutsideArea,
      polygon: settings?.mapPolygonPoints,
    };
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const attach = (
      input: HTMLInputElement | null,
      kind: "pickup" | "dropoff" | "stop",
      index: number
    ) => {
      if (!input || attachedRef.current.has(input)) return;
      attachedRef.current.add(input);

      const autocomplete = new google.maps.places.Autocomplete(
        input,
        buildAutocompleteOptions(settings)
      );

      const listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const handlers = handlersRef.current;

        if (!isPlaceInServiceArea(place, handlers.polygon)) {
          input.value = "";
          handlers.onOutsideArea();
          return;
        }

        const address = place.formatted_address || place.name || "";
        if (kind === "stop") handlers.onStopAddress(index, address);
        else handlers.onAddress(kind, address);
      });

      disposersRef.current.push(() => {
        google.maps.event.removeListener(listener);
        attachedRef.current.delete(input);
      });
    };

    void loadPlacesLibrary().then((places) => {
      if (!places || cancelled) return;

      // buildAutocompleteOptions uses the google global, so ensure it is set.
      attach(pickupRef.current, "pickup", -1);
      attach(dropoffRef.current, "dropoff", -1);
      stopRefs.current
        .slice(0, stopCount)
        .forEach((input, index) => attach(input, "stop", index));
    });

    return () => {
      cancelled = true;
    };
  }, [open, stopCount, settings, pickupRef, dropoffRef, stopRefs]);

  useEffect(
    () => () => {
      disposersRef.current.forEach((dispose) => dispose());
      disposersRef.current = [];
    },
    []
  );
}
