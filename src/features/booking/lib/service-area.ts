import { MIN_POLYGON_POINTS } from "@/features/booking/lib/maps/map-defaults";

/** Shared by the browser (step 1 checks) and the server (quote and booking routes). */
export type LatLng = { lat: number; lng: number };
export type RectBounds = { north: number; south: number; east: number; west: number };
export type ServiceArea =
  | { kind: "polygon"; points: LatLng[] }
  | { kind: "rect"; bounds: RectBounds };

export type ServiceAreaSettings = {
  mapPolygonPoints?: LatLng[] | null;
  mapBounds?: Partial<RectBounds> | null;
} | null | undefined;

export function isPointInPolygon(point: LatLng, polygon: LatLng[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isRect(b: Partial<RectBounds> | null | undefined): b is RectBounds {
  return !!b && [b.north, b.south, b.east, b.west].every((n) => typeof n === "number" && Number.isFinite(n));
}

/** The configured area: the polygon when drawn, else the rectangle, else none (no restriction). */
export function serviceAreaFrom(settings: ServiceAreaSettings): ServiceArea | null {
  const points = settings?.mapPolygonPoints;
  if (points && points.length >= MIN_POLYGON_POINTS) {
    return { kind: "polygon", points: points.map(({ lat, lng }) => ({ lat, lng })) };
  }
  if (isRect(settings?.mapBounds)) {
    const { north, south, east, west } = settings.mapBounds;
    return { kind: "rect", bounds: { north, south, east, west } };
  }
  return null;
}

export function isInServiceArea(point: LatLng, area: ServiceArea | null): boolean {
  if (!area) return true;
  if (area.kind === "polygon") return isPointInPolygon(point, area.points);
  const { north, south, east, west } = area.bounds;
  const inLat = point.lat >= south && point.lat <= north;
  // A rectangle may cross the antimeridian (west > east).
  const inLng = west <= east ? point.lng >= west && point.lng <= east : point.lng >= west || point.lng <= east;
  return inLat && inLng;
}

export type TripLocations = {
  bookingType?: "destination" | "hourly";
  pickup?: string;
  pickupLatLng?: LatLng | null;
  dropoff?: string;
  dropoffLatLng?: LatLng | null;
  stops?: Array<{ location?: string; latLng?: LatLng | null }>;
};

export type ServiceAreaError = "location_required" | "outside_service_area";
export type ServiceAreaField = "pickup" | "dropoff" | "stops";

/**
 * Every address on the trip must carry coordinates inside the area. With no area
 * configured nothing is checked. Ends that have no address are skipped (for
 * example the drop-off of an hourly booking).
 */
export function checkTripServiceArea(
  trip: TripLocations,
  area: ServiceArea | null,
): { ok: true } | { ok: false; error: ServiceAreaError; field: ServiceAreaField } {
  if (!area) return { ok: true };
  const ends: Array<[ServiceAreaField, string | undefined, LatLng | null | undefined]> = [
    ["pickup", trip.pickup, trip.pickupLatLng],
    ["dropoff", trip.dropoff, trip.dropoffLatLng],
    ...(trip.stops ?? []).map((s) => ["stops", s.location, s.latLng] as [ServiceAreaField, string | undefined, LatLng | null | undefined]),
  ];
  for (const [field, text, point] of ends) {
    if (!text?.trim()) continue;
    if (!point) return { ok: false, error: "location_required", field };
    if (!isInServiceArea(point, area)) return { ok: false, error: "outside_service_area", field };
  }
  return { ok: true };
}
