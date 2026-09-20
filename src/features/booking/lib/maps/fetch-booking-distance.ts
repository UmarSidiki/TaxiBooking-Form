import type { DistanceData } from "@/features/booking/context/booking-form-context";

export const MIN_DISTANCE_QUERY_LENGTH = 3;

export type DistanceStop = { location: string; order: number };

export async function fetchBookingDistance(
  origin: string,
  destination: string,
  stops: DistanceStop[] = [],
  isRoundTrip: boolean = false,
) {
  const stopLocations = stops
    .map((stop) => stop.location)
    .filter((location) => location.trim());
  const response = await fetch("/api/distance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origin,
      destination,
      stops: stopLocations,
      isRoundTrip,
    }),
  });

  return {
    stopLocations,
    data: (await response.json()) as {
      success: boolean;
      data: DistanceData;
    },
  };
}
