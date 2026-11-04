export type Coords = { lat: number; lng: number };

export type PositionFailure =
  | "permission-denied"
  | "position-unavailable"
  | "timeout"
  | "insecure-context"
  | "unsupported";

export type PositionResult =
  | { ok: true; coords: Coords }
  | { ok: false; reason: PositionFailure };

/** W3C GeolocationPositionError codes. Compared by number because older iOS Safari has no GeolocationPositionError global. */
const GEO_ERROR = { PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as const;

/** First try: GPS fix, accept a recent cached one. */
export const PRECISE_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12_000,
  maximumAge: 30_000,
};

/** Retry after a timeout or no fix: network/Wi-Fi position, older cache allowed. */
export const COARSE_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 300_000,
};

type GeoEnv = {
  geolocation?: Geolocation;
  isSecureContext?: boolean;
};

function defaultEnv(): GeoEnv {
  if (typeof navigator === "undefined") return {};
  return {
    geolocation: navigator.geolocation,
    isSecureContext: typeof window === "undefined" ? true : window.isSecureContext,
  };
}

function failureFor(error: unknown): PositionFailure {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === GEO_ERROR.PERMISSION_DENIED) return "permission-denied";
  if (code === GEO_ERROR.TIMEOUT) return "timeout";
  return "position-unavailable";
}

function requestOnce(geo: Geolocation, options: PositionOptions): Promise<PositionResult> {
  return new Promise((resolve) => {
    geo.getCurrentPosition(
      (position) =>
        resolve({
          ok: true,
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
        }),
      (error) => resolve({ ok: false, reason: failureFor(error) }),
      options,
    );
  });
}

/**
 * Reads the device position. Must be started from a tap handler so iOS Safari
 * shows its prompt: the first getCurrentPosition call runs synchronously.
 * A denial is final; a timeout or missing fix retries once at low accuracy.
 */
export async function readDevicePosition(env: GeoEnv = defaultEnv()): Promise<PositionResult> {
  if (env.isSecureContext === false) return { ok: false, reason: "insecure-context" };
  const geo = env.geolocation;
  if (!geo) return { ok: false, reason: "unsupported" };

  const precise = await requestOnce(geo, PRECISE_OPTIONS);
  if (precise.ok || precise.reason === "permission-denied") return precise;
  return requestOnce(geo, COARSE_OPTIONS);
}
