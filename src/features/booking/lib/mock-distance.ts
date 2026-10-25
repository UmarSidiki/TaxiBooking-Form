/** Stable stand-in when the maps key is absent and DISTANCE_MOCK=1. */
export function mockRouteKm() {
  return 25.4;
}

export function mockDistancePayload(input: {
  origin: string;
  destination: string;
  stops: string[];
  isRoundTrip: boolean;
}) {
  const km = mockRouteKm();
  const minutes = 32;
  return {
    success: true as const,
    data: {
      distance: {
        value: Math.round(km * 1000),
        text: `${km.toFixed(1)} km${input.isRoundTrip ? " (round trip)" : ""}`,
        km,
      },
      duration: {
        value: minutes * 60,
        text: `${minutes} min`,
        minutes,
      },
      origin: input.origin,
      destination: input.destination,
      stops: input.stops,
    },
  };
}
