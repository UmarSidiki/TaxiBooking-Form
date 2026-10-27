"use client";

import { useEffect, useId, useRef } from "react";
import { loadPlacesLibrary } from "@/features/booking/lib/maps/place-autocomplete";
import { Input } from "@/shared/ui/input";

export type PlacePick = { label: string; lat: number; lng: number; placeId?: string };

const COORDS = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

/** "46.23, 6.10" works without a maps key; otherwise Google Places supplies the point. */
export function parseCoordinates(text: string): PlacePick | null {
  const match = COORDS.exec(text);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { label: text.trim(), lat, lng } : null;
}

export function RouteAddressInput({
  label,
  value,
  error,
  onText,
  onPick,
}: {
  label: string;
  value: string;
  error?: string;
  onText: (text: string) => void;
  onPick: (place: PlacePick) => void;
}) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let listener: google.maps.MapsEventListener | undefined;
    void loadPlacesLibrary()
      .then((places) => {
        if (!places || !ref.current) return;
        const autocomplete = new places.Autocomplete(ref.current, { fields: ["geometry", "formatted_address", "name", "place_id"] });
        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const point = place.geometry?.location;
          if (!point) return;
          pick.current({ label: place.formatted_address || place.name || "", lat: point.lat(), lng: point.lng(), placeId: place.place_id });
        });
      })
      .catch(() => undefined);
    return () => listener?.remove();
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        ref={ref}
        id={id}
        value={value}
        autoComplete="off"
        enterKeyHint="search"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-11 text-base md:text-sm"
        onChange={(event) => onText(event.target.value)}
        onBlur={(event) => {
          const coords = parseCoordinates(event.target.value);
          if (coords) onPick(coords);
        }}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
