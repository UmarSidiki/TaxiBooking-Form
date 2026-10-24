import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { MIN_POLYGON_POINTS } from "@/features/booking/lib/maps/map-defaults";
import { isPointInPolygon } from "@/features/booking/lib/maps/is-place-in-service-area";

export type CurrentPickupFailure =
  | "permission-denied"
  | "unavailable"
  | "outside-service-area";

export type CurrentPickupResult =
  | { ok: true; address: string }
  | { ok: false; reason: CurrentPickupFailure };

type Polygon = Array<{ lat: number; lng: number }> | undefined;
type Coords = { lat: number; lng: number };

const POSITION_TIMEOUT_MS = 10_000;

/** Reads the device position, checks the service area, then reverse-geocodes it. */
export async function reverseGeocodePickup(
  polygonPoints: Polygon,
): Promise<CurrentPickupResult> {
  const point = await readCurrentPoint();
  if (!point.ok) return point;

  if (!isInsideServiceArea(point.coords, polygonPoints)) {
    return { ok: false, reason: "outside-service-area" };
  }

  const address = await lookupAddress(point.coords);
  if (!address) return { ok: false, reason: "unavailable" };
  return { ok: true, address };
}

async function readCurrentPoint(): Promise<
  { ok: true; coords: Coords } | { ok: false; reason: CurrentPickupFailure }
> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ok: false, reason: "unavailable" };
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: POSITION_TIMEOUT_MS,
        maximumAge: 60_000,
      });
    });
    return {
      ok: true,
      coords: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
    };
  } catch (error) {
    const denied =
      error instanceof GeolocationPositionError &&
      error.code === error.PERMISSION_DENIED;
    return { ok: false, reason: denied ? "permission-denied" : "unavailable" };
  }
}

function isInsideServiceArea(point: Coords, polygonPoints: Polygon) {
  if (!polygonPoints || polygonPoints.length < MIN_POLYGON_POINTS) return true;
  return isPointInPolygon(point, polygonPoints);
}

async function lookupAddress(coords: Coords) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  // The maps key has Places enabled. The Geocoding API is not, and calling
  // it logs a console error on every tap, so the nearest street comes from Places.
  setOptions({ key: apiKey, v: "weekly" });
  return nearestStreetAddress(coords);
}

async function nearestStreetAddress(coords: Coords) {
  try {
    const places = await importLibrary("places");
    const service = new places.PlacesService(document.createElement("div"));
    const place = await nearestPlace(service, coords);
    if (!place?.place_id) return null;
    const formatted = await formattedPlaceAddress(service, place.place_id);
    if (formatted) return formatted;
    const fallback = [place.name, place.vicinity].filter(Boolean).join(", ");
    return fallback || null;
  } catch {
    return null;
  }
}

function nearestPlace(
  service: google.maps.places.PlacesService,
  coords: Coords,
) {
  return new Promise<google.maps.places.PlaceResult | null>((resolve) => {
    service.nearbySearch({ location: coords, radius: 50 }, (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) {
        resolve(null);
        return;
      }
      resolve(results.find((result) => result.types?.includes("route")) ?? results[0]);
    });
  });
}

function formattedPlaceAddress(
  service: google.maps.places.PlacesService,
  placeId: string,
) {
  return new Promise<string | null>((resolve) => {
    service.getDetails(
      { placeId, fields: ["formatted_address"] },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          resolve(null);
          return;
        }
        resolve(place?.formatted_address?.trim() || null);
      },
    );
  });
}
