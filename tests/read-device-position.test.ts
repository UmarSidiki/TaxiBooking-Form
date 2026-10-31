import { describe, expect, it, vi } from "vitest";
import {
  COARSE_OPTIONS,
  PRECISE_OPTIONS,
  readDevicePosition,
} from "@/features/booking/lib/maps/read-device-position";

type Outcome = { coords: { latitude: number; longitude: number } } | { code: number };

function fakeGeo(...outcomes: Outcome[]) {
  const getCurrentPosition = vi.fn(
    (ok: PositionCallback, fail?: PositionErrorCallback | null) => {
      const next = outcomes.shift()!;
      if ("code" in next) fail?.(next as GeolocationPositionError);
      else ok(next as GeolocationPosition);
    },
  );
  return { geolocation: { getCurrentPosition } as unknown as Geolocation, getCurrentPosition };
}

const FIX = { coords: { latitude: 46.2, longitude: 6.1 } };

describe("readDevicePosition", () => {
  it("returns coords from a precise fix", async () => {
    const geo = fakeGeo(FIX);
    await expect(readDevicePosition({ ...geo, isSecureContext: true })).resolves.toEqual({
      ok: true,
      coords: { lat: 46.2, lng: 6.1 },
    });
    expect(geo.getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), PRECISE_OPTIONS);
  });

  it("reports a denial without retrying", async () => {
    const geo = fakeGeo({ code: 1 });
    await expect(readDevicePosition(geo)).resolves.toEqual({ ok: false, reason: "permission-denied" });
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it.each([2, 3])("retries at low accuracy after error code %i", async (code) => {
    const geo = fakeGeo({ code }, FIX);
    const result = await readDevicePosition(geo);
    expect(result.ok).toBe(true);
    expect(geo.getCurrentPosition).toHaveBeenLastCalledWith(expect.any(Function), expect.any(Function), COARSE_OPTIONS);
  });

  it("does not treat a timeout or missing fix as a denial", async () => {
    await expect(readDevicePosition(fakeGeo({ code: 3 }, { code: 3 }))).resolves.toEqual({ ok: false, reason: "timeout" });
    await expect(readDevicePosition(fakeGeo({ code: 3 }, { code: 2 }))).resolves.toEqual({ ok: false, reason: "position-unavailable" });
  });

  it("flags insecure pages and missing geolocation", async () => {
    await expect(readDevicePosition({ ...fakeGeo(FIX), isSecureContext: false })).resolves.toEqual({ ok: false, reason: "insecure-context" });
    await expect(readDevicePosition({})).resolves.toEqual({ ok: false, reason: "unsupported" });
  });
});

describe("security headers", () => {
  it("lets the booking page itself use geolocation", async () => {
    const { default: config } = await import("../next.config");
    const rules = await config.headers!();
    const policy = rules.flatMap((r) => r.headers).find((h) => h.key === "Permissions-Policy")!.value;
    expect(policy).toMatch(/geolocation=\(self\)/);
  });
});
