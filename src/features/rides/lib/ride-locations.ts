export type LatLng = { lat: number; lng: number };

export type RideLocationKind = "pickup" | "stop" | "dropoff";

export type RideLocation = {
  kind: RideLocationKind;
  /** 1-based stop number; only set for stops. */
  number?: number;
  address: string;
  coords: LatLng | null;
  /** Opens the place in Google Maps (native app on Android and iOS). */
  mapsUrl: string;
  /** Turn-by-turn directions to the place. */
  directionsUrl: string;
};

export type RideLocationSource = {
  pickup: string;
  pickupLatLng?: LatLng | null;
  dropoff?: string | null;
  dropoffLatLng?: LatLng | null;
  stops?: Array<{ location: string; order: number; latLng?: LatLng | null }> | null;
  bookingType?: string | null;
};

const PLACEHOLDER_DROPOFF = new Set(["", "n/a", "—", "-"]);

export function validCoords(value: unknown): LatLng | null {
  if (!value || typeof value !== "object") return null;
  const { lat, lng } = value as { lat?: unknown; lng?: unknown };
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function formatCoords(coords: LatLng): string {
  return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
}

function query(address: string, coords: LatLng | null) {
  return encodeURIComponent(coords ? `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}` : address.trim());
}

export function mapsSearchUrl(address: string, coords?: LatLng | null): string {
  return `https://www.google.com/maps/search/?api=1&query=${query(address, validCoords(coords))}`;
}

export function mapsDirectionsUrl(address: string, coords?: LatLng | null): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${query(address, validCoords(coords))}`;
}

function locationOf(kind: RideLocationKind, address: string, raw: unknown, number?: number): RideLocation {
  const coords = validCoords(raw);
  return {
    kind,
    ...(number ? { number } : {}),
    address,
    coords,
    mapsUrl: mapsSearchUrl(address, coords),
    directionsUrl: mapsDirectionsUrl(address, coords),
  };
}

/** Pickup, stops in order, and drop-off. Hourly rides have a pickup only. */
export function rideLocationsOf(ride: RideLocationSource): RideLocation[] {
  const list = [locationOf("pickup", ride.pickup, ride.pickupLatLng)];
  if (ride.bookingType === "hourly") return list;
  const stops = (ride.stops ?? [])
    .filter((stop) => stop.location?.trim())
    .slice()
    .sort((a, b) => a.order - b.order);
  stops.forEach((stop, index) => list.push(locationOf("stop", stop.location, stop.latLng, index + 1)));
  const dropoff = ride.dropoff?.trim() ?? "";
  if (!PLACEHOLDER_DROPOFF.has(dropoff.toLowerCase())) {
    list.push(locationOf("dropoff", dropoff, ride.dropoffLatLng));
  }
  return list;
}

const ICON: Record<RideLocationKind, string> = { pickup: "🟢", stop: "🔵", dropoff: "🏁" };

/** Plain-text block for WhatsApp: address, coordinates when known, and a maps link per place. */
export function rideLocationsText(locations: RideLocation[]): string {
  return locations
    .map((place) => {
      const head = place.kind === "stop" ? `${ICON.stop} ${place.number}. ${place.address}` : `${ICON[place.kind]} ${place.address}`;
      const lines = [head];
      if (place.coords) lines.push(`📍 ${formatCoords(place.coords)}`);
      lines.push(place.mapsUrl);
      return lines.join("\n");
    })
    .join("\n\n");
}
