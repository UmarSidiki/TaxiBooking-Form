/**
 * Server-only: calls the Google Directions API. Never import this from a
 * client component - it belongs to the server fare pipeline.
 */
export async function fetchRouteDistanceKm(input: {
  pickup: string;
  dropoff: string;
  stops?: Array<{ location: string }>;
}): Promise<number | undefined> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || !input.pickup || !input.dropoff) {
    return undefined;
  }

  const validStops = (input.stops || [])
    .map((stop) => stop.location?.trim())
    .filter((location): location is string => Boolean(location));

  const waypoints =
    validStops.length > 0
      ? `&waypoints=${validStops.map((stop) => `via:${encodeURIComponent(stop)}`).join("|")}`
      : "";

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    input.pickup
  )}&destination=${encodeURIComponent(input.dropoff)}${waypoints}&key=${apiKey}&units=metric`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" || !data.routes?.[0]) {
    return undefined;
  }

  const meters = data.routes[0].legs.reduce(
    (total: number, leg: { distance: { value: number } }) =>
      total + leg.distance.value,
    0
  );

  return meters / 1000;
}
