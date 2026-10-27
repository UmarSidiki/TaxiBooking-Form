import { mockRouteKm } from "@/features/booking/lib/mock-distance";
export type GeoPoint = { lat: number; lng: number };

export type MeasuredRoute = { km: number; pickup?: GeoPoint; dropoff?: GeoPoint };

type RouteInput = { pickup: string; dropoff: string; stops?: Array<{ location: string }> };

const recent = new Map<string, { at: number; route: MeasuredRoute | undefined }>();
const CACHE_MS = 60_000;

/**
 * Server-only: calls the Google Directions API once per route per minute and
 * returns the distance plus the geocoded start and end. Never import this from
 * a client component - it belongs to the server fare pipeline.
 */
export async function fetchRoute(input: RouteInput): Promise<MeasuredRoute | undefined> {
  if (!input.pickup || !input.dropoff) return undefined;
  if (process.env.DISTANCE_MOCK === "1") return { km: mockRouteKm() };
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return undefined;

  const validStops = (input.stops || [])
    .map((stop) => stop.location?.trim())
    .filter((location): location is string => Boolean(location));
  const key = [input.pickup, input.dropoff, ...validStops].join("|");
  const cached = recent.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.route;

  const waypoints =
    validStops.length > 0
      ? `&waypoints=${validStops.map((stop) => `via:${encodeURIComponent(stop)}`).join("|")}`
      : "";
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    input.pickup
  )}&destination=${encodeURIComponent(input.dropoff)}${waypoints}&key=${apiKey}&units=metric`;

  const response = await fetch(url);
  const data = await response.json();
  type Leg = { distance: { value: number }; start_location: GeoPoint; end_location: GeoPoint };
  const legs: Leg[] | undefined = data.status === "OK" ? data.routes?.[0]?.legs : undefined;
  const route = legs?.length
    ? {
        km: legs.reduce((total, leg) => total + leg.distance.value, 0) / 1000,
        pickup: legs[0].start_location,
        dropoff: legs[legs.length - 1].end_location,
      }
    : undefined;
  if (recent.size > 200) recent.clear();
  recent.set(key, { at: Date.now(), route });
  return route;
}

export async function fetchRouteDistanceKm(input: RouteInput): Promise<number | undefined> {
  return (await fetchRoute(input))?.km;
}
