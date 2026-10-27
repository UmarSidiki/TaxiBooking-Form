export type GeoPoint = { lat: number; lng: number };
export type RoutePlace = GeoPoint & { label: string; placeId?: string; radiusKm: number };
export type FixedRouteFare = { from: RoutePlace[]; to: RoutePlace[]; price: number; bothWays?: boolean };

const EARTH_KM = 6371;

export function haversineKm(a: GeoPoint, b: GeoPoint) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** Smallest radius among `places` that contains `point`, or null when none does. */
function closestRadius(point: GeoPoint, places: RoutePlace[]) {
  const hits = places.filter((place) => haversineKm(point, place) <= place.radiusKm).map((place) => place.radiusKm);
  return hits.length ? Math.min(...hits) : null;
}

/**
 * Fixed price for a trip whose server-measured endpoints fall inside a route's
 * A and B circles (or B and A when the route runs both ways). The tightest match wins.
 */
export function matchFixedRoute(pickup: GeoPoint | undefined, dropoff: GeoPoint | undefined, routes: FixedRouteFare[]) {
  if (!pickup || !dropoff) return undefined;
  let best: { price: number; spread: number } | undefined;
  for (const route of routes) {
    const directions: [RoutePlace[], RoutePlace[]][] = [[route.from, route.to]];
    if (route.bothWays) directions.push([route.to, route.from]);
    for (const [a, b] of directions) {
      const ra = closestRadius(pickup, a);
      const rb = closestRadius(dropoff, b);
      if (ra === null || rb === null) continue;
      if (!best || ra + rb < best.spread) best = { price: route.price, spread: ra + rb };
    }
  }
  return best?.price;
}
