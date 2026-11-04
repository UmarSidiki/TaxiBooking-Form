import { expect, test, type Page } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:3000";

type MarkerRecord = { icon: { url: string }; active: boolean };
type Stub = {
  markers: MarkerRecord[];
  fitBounds: Array<{ top: number; right: number; bottom: number; left: number }>;
  rendererOptions: Array<{ polylineOptions?: { strokeColor?: string; strokeWeight?: number } }>;
  routeCalls: unknown[];
};

declare global {
  interface Window {
    __routeMap: Stub;
  }
}

const TRIP = {
  pickup: "Geneva Airport",
  pickupLatLng: { lat: 46.2381, lng: 6.109 },
  stopOne: { location: "Nyon", latLng: { lat: 46.3833, lng: 6.2395 }, order: 1 },
  stopTwo: { location: "Morges", latLng: { lat: 46.5113, lng: 6.4985 }, order: 2 },
  dropoff: "Lausanne Station",
  dropoffLatLng: { lat: 46.5197, lng: 6.6323 },
};

function installRouteMapStub() {
  const state: Stub = { markers: [], fitBounds: [], rendererOptions: [], routeCalls: [] };

  class FakeMap {
    setOptions() {}
    setCenter() {}
    fitBounds(_bounds: unknown, padding: Stub["fitBounds"][number]) {
      state.fitBounds.push(padding);
    }
  }

  class FakeMarker {
    private readonly record: MarkerRecord;
    constructor(options: { icon: MarkerRecord["icon"] }) {
      this.record = { icon: options.icon, active: true };
      state.markers.push(this.record);
    }
    setMap(map: unknown) {
      this.record.active = map !== null && map !== undefined;
    }
    setIcon(icon: MarkerRecord["icon"]) {
      this.record.icon = icon;
    }
  }

  class FakeDirectionsService {
    route(request: { origin: unknown; destination: unknown; waypoints?: Array<{ location: unknown }> }) {
      state.routeCalls.push(request);
      const points = [request.origin, ...(request.waypoints ?? []).map((stop) => stop.location), request.destination];
      const legs = points.slice(1).map((point, index) => ({ start_location: points[index], end_location: point }));
      return Promise.resolve({ routes: [{ legs, bounds: { id: "stub-bounds" } }] });
    }
  }

  class FakeDirectionsRenderer {
    setOptions(options: Stub["rendererOptions"][number]) {
      state.rendererOptions.push(options);
    }
    set() {}
    setDirections() {}
  }

  class FakeAutocomplete {
    addListener() {
      return { remove: () => {} };
    }
    getPlace() {
      return {};
    }
  }

  class FakeLatLng {
    constructor(private readonly latitude: number, private readonly longitude: number) {}
    lat() {
      return this.latitude;
    }
    lng() {
      return this.longitude;
    }
  }

  class FakeLatLngBounds {
    extend() {}
  }

  class FakeSize {
    constructor(
      readonly width: number,
      readonly height: number,
    ) {}
  }

  class FakePoint {
    constructor(
      readonly x: number,
      readonly y: number,
    ) {}
  }

  const maps = {
    Map: FakeMap,
    Marker: FakeMarker,
    DirectionsService: FakeDirectionsService,
    DirectionsRenderer: FakeDirectionsRenderer,
    Autocomplete: FakeAutocomplete,
    PlacesService: class {},
    Geocoder: class {},
    LatLng: FakeLatLng,
    LatLngBounds: FakeLatLngBounds,
    Size: FakeSize,
    Point: FakePoint,
    TravelMode: { DRIVING: "DRIVING" },
    event: { removeListener: () => {} },
    PlacesServiceStatus: { OK: "OK" },
  };
  (maps as unknown as { importLibrary: (name: string) => Promise<unknown> }).importLibrary = async () => maps;

  (window as unknown as { google: unknown }).google = { maps };
  window.__routeMap = state;
}

function seedTrip(page: Page) {
  return page.addInitScript((trip) => {
    sessionStorage.setItem(
      "booking_form_data",
      JSON.stringify({
        pickup: trip.pickup,
        pickupLatLng: trip.pickupLatLng,
        dropoff: trip.dropoff,
        dropoffLatLng: trip.dropoffLatLng,
        stops: [trip.stopOne, trip.stopTwo],
        formStartedAt: Date.now(),
      }),
    );
  }, TRIP);
}

async function openMap(page: Page) {
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".riviera .map")).toBeVisible({ timeout: 120_000 });
  await expect
    .poll(() => page.evaluate(() => window.__routeMap?.markers.filter((marker) => marker.active).length ?? 0), {
      timeout: 30_000,
    })
    .toBe(4);
}

async function readState(page: Page) {
  return page.evaluate(() => {
    const scope = document.querySelector<HTMLElement>(".riviera");
    const dock = document.querySelector<HTMLElement>(".riviera .dock");
    const style = scope ? getComputedStyle(scope) : null;
    return {
      markers: window.__routeMap.markers.filter((marker) => marker.active).map((marker) => decodeURIComponent(marker.icon.url.split(",")[1])),
      fitBounds: window.__routeMap.fitBounds,
      rendererOptions: window.__routeMap.rendererOptions,
      ink: style?.getPropertyValue("--ink").trim() ?? "",
      sheet: style?.getPropertyValue("--sheet").trim() ?? "",
      dockHeight: dock?.getBoundingClientRect().height ?? 0,
    };
  });
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
] as const) {
  test(`step 1 map markers and route ${viewport.name}`, async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({
      baseURL: BASE_URL,
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.mobile,
      hasTouch: viewport.mobile,
      deviceScaleFactor: viewport.mobile ? 2 : 1,
      reducedMotion: "reduce",
    });
    await context.addInitScript(installRouteMapStub);
    const page = await context.newPage();
    page.setDefaultTimeout(90_000);
    page.setDefaultNavigationTimeout(180_000);
    await seedTrip(page);

    try {
      await openMap(page);
      const light = await readState(page);

      const pickup = light.markers.find((svg) => svg.includes('stroke-width="5"'));
      const dropoff = light.markers.find((svg) => svg.includes("<rect"));
      const stops = light.markers.filter((svg) => svg.includes("<text"));

      expect(pickup, "pickup ring marker is missing").toBeDefined();
      expect(pickup).toContain(`stroke="${light.ink}"`);
      expect(pickup).toContain(`fill="${light.sheet}"`);
      expect(pickup).toContain('r="11"');

      expect(dropoff, "drop-off marker is missing").toBeDefined();
      expect(dropoff).toContain('width="22" height="22" rx="4"');
      expect(dropoff).toContain(`fill="${light.ink}"`);

      expect(stops).toHaveLength(2);
      expect(stops[0]).toContain(`fill="${light.ink}"`);
      expect(stops[0]).toContain(`fill="${light.sheet}"`);
      expect(stops[0]).toContain('r="13"');
      expect(stops[0]).toContain(">1</text>");
      expect(stops[1]).toContain(">2</text>");

      const polyline = light.rendererOptions.at(-1)?.polylineOptions;
      expect(polyline).toMatchObject({ strokeColor: light.ink, strokeWeight: 5 });

      const padding = light.fitBounds.at(-1);
      expect(padding).toBeDefined();
      expect(padding).toMatchObject({ top: 24, left: 24, right: 24 });
      expect(padding?.bottom).toBe(
        viewport.mobile ? 24 : Math.round(light.dockHeight + 40),
      );

      // A theme flip repaints every marker from the new tokens.
      await page.evaluate(() => {
        document.documentElement.dataset.rivieraTheme = "dark";
      });
      await expect
        .poll(async () => {
          const state = await readState(page);
          return state.markers.find((svg) => svg.includes("<text"))?.includes(`fill="${state.ink}"`) ?? false;
        })
        .toBe(true);
      const dark = await readState(page);
      expect(dark.ink).not.toBe(light.ink);
      expect(dark.markers).toHaveLength(4);
      expect(dark.markers.filter((svg) => svg.includes(`fill="${dark.sheet}"`))).not.toEqual([]);

      // A palette swap repaints them again, still from computed tokens.
      await page.evaluate(() => {
        document.documentElement.dataset.rivieraTheme = "light";
        document.documentElement.dataset.palette = "slate";
      });
      await expect.poll(async () => (await readState(page)).ink.toLowerCase()).toBe("#161a23");
      const slate = await readState(page);
      expect(slate.markers.find((svg) => svg.includes("<text"))).toContain(`fill="${slate.ink}"`);
      expect(slate.markers.find((svg) => svg.includes("<rect"))).toContain(`fill="${slate.ink}"`);
    } finally {
      await context.close();
    }
  });
}
