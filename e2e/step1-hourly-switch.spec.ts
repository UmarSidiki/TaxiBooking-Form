import { expect, test } from "@playwright/test";

/** Round trip -> Hourly collapses to one date/time and drops the route (pickup marker only);
 *  back to Transfer redraws the route from the current inputs. Google Maps is stubbed;
 *  run with NEXT_PUBLIC_GOOGLE_MAPS_API_KEY set to any dummy value so the map mounts. */
const TAG = process.env.HOURLY_TAG ?? "after";

type MapState = { markers: Array<{ active: boolean }>; hasRoute: boolean; routeCalls: number };
declare global {
  interface Window {
    __hourlyMap: MapState;
  }
}

function installMapStub() {
  const state: MapState = { markers: [], hasRoute: false, routeCalls: 0 };
  class FakeMap { setOptions() {} setCenter() {} panTo() {} fitBounds() {} }
  class FakeMarker {
    private readonly rec = { active: true };
    constructor() { state.markers.push(this.rec); }
    setMap(map: unknown) { this.rec.active = map != null; }
    setIcon() {}
  }
  class FakeDirectionsService {
    route(req: { origin: unknown; destination: unknown; waypoints?: Array<{ location: unknown }> }) {
      state.routeCalls += 1;
      const pts = [req.origin, ...(req.waypoints ?? []).map((w) => w.location), req.destination];
      const legs = pts.slice(1).map((p, i) => ({ start_location: pts[i], end_location: p }));
      return Promise.resolve({ routes: [{ legs, bounds: {} }] });
    }
  }
  class FakeDirectionsRenderer {
    setOptions() {}
    set(key: string, value: unknown) { if (key === "directions") state.hasRoute = value != null; }
    setDirections() { state.hasRoute = true; }
  }
  const maps = {
    Map: FakeMap, Marker: FakeMarker, DirectionsService: FakeDirectionsService, DirectionsRenderer: FakeDirectionsRenderer,
    Autocomplete: class { addListener() { return { remove() {} }; } getPlace() { return {}; } },
    PlacesService: class {}, Geocoder: class {}, LatLngBounds: class { extend() {} },
    LatLng: class { constructor(private a: number, private b: number) {} lat() { return this.a; } lng() { return this.b; } },
    Size: class { constructor(readonly width: number, readonly height: number) {} },
    Point: class { constructor(readonly x: number, readonly y: number) {} },
    TravelMode: { DRIVING: "DRIVING" }, event: { removeListener() {} }, PlacesServiceStatus: { OK: "OK" },
  };
  (maps as unknown as { importLibrary: () => Promise<unknown> }).importLibrary = async () => maps;
  (window as unknown as { google: unknown }).google = { maps };
  window.__hourlyMap = state;
}

const readMap = (page: import("@playwright/test").Page) =>
  page.evaluate(() => ({
    markers: window.__hourlyMap.markers.filter((m) => m.active).length,
    hasRoute: window.__hourlyMap.hasRoute,
  }));

test("round trip to hourly and back", async ({ browser, browserName, baseURL }) => {
  test.setTimeout(240_000);
  const ctx = await browser.newContext({
    baseURL, viewport: { width: 390, height: 844 }, isMobile: browserName === "chromium", hasTouch: true, reducedMotion: "reduce",
  });
  await ctx.addInitScript(installMapStub);
  await ctx.addInitScript(() => {
    if (sessionStorage.getItem("booking_form_data")) return;
    sessionStorage.setItem("booking_form_data", JSON.stringify({
      pickup: "Geneva Airport", pickupLatLng: { lat: 46.2381, lng: 6.109 },
      dropoff: "Lausanne Station", dropoffLatLng: { lat: 46.5197, lng: 6.6323 },
      stops: [], tripType: "roundtrip", formStartedAt: Date.now(),
    }));
  });
  const page = await ctx.newPage();
  await page.goto("/en", { waitUntil: "domcontentloaded", timeout: 180_000 });
  await expect(page.locator("#booking-pickup")).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole("radio", { name: "Round trip" })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator('input[type="date"]')).toHaveCount(2);
  await expect.poll(() => readMap(page), { timeout: 30_000 }).toEqual({ markers: 2, hasRoute: true });
  await page.screenshot({ path: `/workspace/shots/hourly-fix-${TAG}-roundtrip-${browserName}.png`, fullPage: true });

  await page.getByRole("radio", { name: "Hourly", exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `/workspace/shots/hourly-fix-${TAG}-hourly-${browserName}.png`, fullPage: true });
  await expect(page.locator('input[type="date"]')).toHaveCount(1);
  await expect(page.locator('input[type="time"]')).toHaveCount(1);
  await expect(page.locator("#booking-dropoff")).toHaveCount(0);
  await expect.poll(() => readMap(page)).toEqual({ markers: 1, hasRoute: false });

  await page.getByRole("radio", { name: "Transfer", exact: true }).click();
  await expect(page.getByRole("radio", { name: "One way" })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator('input[type="date"]')).toHaveCount(1);
  await expect(page.locator("#booking-dropoff")).toHaveValue("");
  await expect(page.locator("#booking-pickup")).toHaveValue("Geneva Airport");
  // No drop-off yet: no route and no stale markers.
  await expect.poll(() => readMap(page)).toEqual({ markers: 0, hasRoute: false });
  await page.screenshot({ path: `/workspace/shots/hourly-fix-${TAG}-back-${browserName}.png`, fullPage: true });
  await ctx.close();
});
