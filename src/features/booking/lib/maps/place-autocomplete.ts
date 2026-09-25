import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { MIN_POLYGON_POINTS } from "@/features/booking/lib/maps/map-defaults";

export type AutocompleteBoundsSettings = {
  mapPolygonPoints?: Array<{ lat: number; lng: number }>;
  mapBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
};

/** Loads the Places library. Returns null when no maps key is configured. */
export async function loadPlacesLibrary() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  setOptions({ key: apiKey, v: "weekly" });
  return importLibrary("places");
}

/**
 * True when a pointer/focus event came from Google's suggestion list. Radix
 * dispatches its outside-interaction event on the original target, so accept
 * either shape.
 */
export function isPlacesAutocompleteEvent(event: {
  target?: EventTarget | null;
  detail?: { originalEvent?: { target?: EventTarget | null } };
}): boolean {
  return (
    isPlacesAutocompleteTarget(event.target) ||
    isPlacesAutocompleteTarget(event.detail?.originalEvent?.target)
  );
}

function isPlacesAutocompleteTarget(target?: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest(".pac-container") !== null
  );
}

/**
 * Restricts suggestions to the operator's service area: the polygon bounding
 * box when one is configured, otherwise the rectangular bounds.
 */
export function buildAutocompleteOptions(
  settings: AutocompleteBoundsSettings | null | undefined
): google.maps.places.AutocompleteOptions {
  const options: google.maps.places.AutocompleteOptions = {
    strictBounds: true,
  };

  if (
    settings?.mapPolygonPoints &&
    settings.mapPolygonPoints.length >= MIN_POLYGON_POINTS
  ) {
    const bounds = new google.maps.LatLngBounds();
    settings.mapPolygonPoints.forEach((point) => {
      bounds.extend(new google.maps.LatLng(point.lat, point.lng));
    });
    options.bounds = bounds;
  } else if (settings?.mapBounds) {
    options.bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(settings.mapBounds.south, settings.mapBounds.west),
      new google.maps.LatLng(settings.mapBounds.north, settings.mapBounds.east)
    );
  }

  return options;
}
