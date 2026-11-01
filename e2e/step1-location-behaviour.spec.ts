import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";

const BASE_URL = "http://127.0.0.1:3000";

type Messages = { [key: string]: string | Messages };
const EN_MESSAGES = JSON.parse(
  readFileSync(join(process.cwd(), "messages/en.json"), "utf8"),
) as Messages;

function message(key: string): string {
  let node: string | Messages = EN_MESSAGES;
  for (const part of key.split(".")) {
    if (typeof node === "string") break;
    node = node[part] ?? "";
  }
  if (typeof node !== "string" || node.length === 0) {
    throw new Error(`messages/en.json has no "${key}"`);
  }
  return node;
}

const OUTSIDE = message("Step1.location-outside-service-area");
const PERMISSION_DENIED = message("Step1.location-permission-denied");
const USE_CURRENT_LOCATION = message("Step1.use-current-location");
const CONTINUE = message("Step1.ContinueToVehicleSelection");

const SERVICE_BOUNDS = { north: 46.4, south: 46.0, east: 6.4, west: 5.9 };
const REVERSE_ADDRESS = "Rue du Lac 12, 1207 Genève, Switzerland";

const INSIDE = { address: "Quai du Mont-Blanc 10, 1201 Genève", lat: 46.2095, lng: 6.1478 };
const OUTSIDE_PLACE = { address: "1 Rue de Rivoli, 75001 Paris", lat: 48.8606, lng: 2.3376 };

type GmPlaceSpec = { address: string; lat: number; lng: number };
type GmLatLng = { lat: number; lng: number };
type GmRouteCall = {
  origin: GmLatLng | string | null;
  destination: GmLatLng | string | null;
  waypoints: Array<{ location: GmLatLng | string }>;
};

type GmStub = {
  boundInputIds: () => string[];
  detachedListenerCount: () => number;
  select: (inputId: string, place: GmPlaceSpec) => boolean;
  routeCalls: GmRouteCall[];
};

declare global {
  interface Window {
    __gm: GmStub;
  }
}

type Cookies = Parameters<BrowserContext["addCookies"]>[0];
let authCookies: Cookies = [];

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  await signInAdmin(page);
  const reset = await page.request.post("/api/settings", {
    data: { colorPalette: "neutral", mapBounds: null, mapPolygonPoints: null },
  });
  expect(reset.ok()).toBe(true);
  authCookies = await context.cookies();
  await context.close();
});

/**
 * A minimal in-page Google Maps implementation. It replaces the real API via
 * `google.maps.importLibrary`, so the app's own binding code runs unchanged and
 * the test can drive Autocomplete, Directions and PlacesService callbacks.
 */
function installMapsStub() {
  type Spec = { address: string; lat: number; lng: number };

  const records: FakeAutocomplete[] = [];
  const state = {
    routeCalls: [] as GmRouteCall[],
    reverseAddress: "Rue du Lac 12, 1207 Genève, Switzerland",
  };

  const fakePlace = (spec: Spec) => ({
    formatted_address: spec.address,
    name: spec.address,
    geometry: { location: { lat: () => spec.lat, lng: () => spec.lng } },
  });

  class FakeAutocomplete {
    input: HTMLInputElement;
    place: unknown = null;
    listeners: Record<string, Array<() => void>> = {};

    constructor(input: HTMLInputElement) {
      this.input = input;
      records.push(this);
    }

    addListener(event: string, callback: () => void) {
      (this.listeners[event] ??= []).push(callback);
      return { remove: () => this.removeListener(event, callback) };
    }

    private removeListener(event: string, callback: () => void) {
      const list = this.listeners[event];
      if (!list) return;
      const index = list.indexOf(callback);
      if (index >= 0) list.splice(index, 1);
    }

    getPlace() {
      return this.place;
    }

    setPlace(spec: Spec) {
      this.place = fakePlace(spec);
      this.input.value = spec.address;
      for (const callback of this.listeners.place_changed ?? []) callback();
    }
  }

  const toLatLng = (value: unknown): GmLatLng =>
    value && typeof value === "object"
      ? (value as GmLatLng)
      : { lat: 46.2044, lng: 6.1432 };

  class FakeDirectionsService {
    route(request: {
      origin?: unknown;
      destination?: unknown;
      waypoints?: Array<{ location?: unknown }>;
    }, callback?: (result: unknown, status: string) => void) {
      state.routeCalls.push({
        origin: (request.origin as GmLatLng | string) ?? null,
        destination: (request.destination as GmLatLng | string) ?? null,
        waypoints: (request.waypoints ?? []).map((waypoint) => ({
          location: (waypoint.location as GmLatLng | string) ?? "",
        })),
      });
      const points = [
        request.origin,
        ...(request.waypoints ?? []).map((waypoint) => waypoint.location),
        request.destination,
      ].map(toLatLng);
      const legs = points.slice(1).map((point, index) => ({
        start_location: points[index],
        end_location: point,
      }));
      const result = { routes: [{ legs }] };
      if (callback) window.setTimeout(() => callback(result, "OK"), 0);
      return Promise.resolve(result);
    }
  }

  class FakeDirectionsRenderer {
    constructor(_options?: unknown) {}
    setDirections(_result: unknown) {}
    setOptions(_options: unknown) {}
    set(_key: string, _value: unknown) {}
  }

  class FakeMap {
    constructor(_element: HTMLElement, _options?: unknown) {}
    setOptions(_options: unknown) {}
    setCenter(_center: unknown) {}
    fitBounds(_bounds: unknown) {}
  }

  class FakeMarker {
    constructor(_options?: unknown) {}
    setMap(_map: unknown) {}
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
    extend(_point: unknown) {}
  }

  class FakeSize {
    constructor(_width: number, _height: number) {}
  }

  class FakePoint {
    constructor(_x: number, _y: number) {}
  }

  class FakePlacesService {
    constructor(_element: HTMLElement) {}
    nearbySearch(_request: unknown, callback: (results: unknown[], status: string) => void) {
      window.setTimeout(
        () =>
          callback(
            [{ place_id: "stub-place", name: "Rue du Lac", types: ["route"] }],
            "OK",
          ),
        0,
      );
    }
    getDetails(_request: unknown, callback: (place: unknown, status: string) => void) {
      window.setTimeout(
        () => callback({ formatted_address: state.reverseAddress }, "OK"),
        0,
      );
    }
  }

  class FakeGeocoder {
    geocode(
      _request: unknown,
      callback: (results: unknown[], status: string) => void,
    ) {
      window.setTimeout(
        () =>
          callback(
            [
              {
                formatted_address: state.reverseAddress,
                geometry: { location: { lat: () => 46.2, lng: () => 6.14 } },
              },
            ],
            "OK",
          ),
        0,
      );
    }
  }

  const places = {
    Autocomplete: FakeAutocomplete,
    PlacesService: FakePlacesService,
    PlacesServiceStatus: { OK: "OK" },
  };

  const maps: Record<string, unknown> = {
    Map: FakeMap,
    Marker: FakeMarker,
    DirectionsService: FakeDirectionsService,
    DirectionsRenderer: FakeDirectionsRenderer,
    Geocoder: FakeGeocoder,
    LatLng: FakeLatLng,
    LatLngBounds: FakeLatLngBounds,
    Size: FakeSize,
    Point: FakePoint,
    TravelMode: { DRIVING: "DRIVING" },
    event: {
      removeListener: (listener: { remove?: () => void } | null | undefined) => {
        listener?.remove?.();
      },
    },
    places,
  };
  maps.importLibrary = async (name: string) => (name === "places" ? places : maps);

  const gm: GmStub = {
    boundInputIds: () =>
      Array.from(
        new Set(
          records
            .filter((record) => record.input.isConnected && record.input.id)
            .map((record) => record.input.id),
        ),
      ),
    select: (inputId: string, place: Spec) => {
      const matches = records.filter(
        (record) => record.input.id === inputId && record.input.isConnected,
      );
      for (const record of matches) record.setPlace(place);
      return matches.length > 0;
    },
    detachedListenerCount: () =>
      records.reduce(
        (count, record) =>
          record.input.isConnected
            ? count
            : count + (record.listeners.place_changed?.length ?? 0),
        0,
      ),
    routeCalls: state.routeCalls,
  };

  (window as unknown as { google: unknown }).google = { maps };
  (window as unknown as { __gm: GmStub }).__gm = gm;
}

type DevicePosition = { latitude: number; longitude: number };

async function newPage(
  browser: Browser,
  { grantsLocation = false, geolocation = null as DevicePosition | null } = {},
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await context.addCookies(authCookies);
  await context.addInitScript(installMapsStub);
  if (grantsLocation) {
    await context.grantPermissions(["geolocation"], { origin: BASE_URL });
    if (geolocation) await context.setGeolocation(geolocation);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(90_000);
  page.setDefaultNavigationTimeout(180_000);
  await mockDistance(page);
  await blockGoogleNetwork(page);
  return { context, page };
}

async function mockDistance(page: Page) {
  await page.route("**/api/distance", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          distance: { value: 25_400, text: "25.4 km", km: 25.4 },
          duration: { value: 1_920, text: "32 min", minutes: 32 },
        },
      }),
    }),
  );
}

async function blockGoogleNetwork(page: Page) {
  await page.route(/https:\/\/(maps\.googleapis\.com|places\.googleapis\.com)\//, (route) =>
    route.abort(),
  );
}

async function openForm(page: Page) {
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  await page.locator(".riviera").first().waitFor({ state: "visible", timeout: 120_000 });
  await expect(page.locator("#booking-pickup")).toBeVisible({ timeout: 90_000 });
}

async function waitForBound(page: Page, ids: string[]) {
  await expect
    .poll(() => page.evaluate(() => window.__gm.boundInputIds()), { timeout: 30_000 })
    .toEqual(expect.arrayContaining(ids));
}

async function selectPlace(page: Page, inputId: string, place: GmPlaceSpec) {
  const bound = await page.evaluate(
    ({ id, spec }) => window.__gm.select(id, spec),
    { id: inputId, spec: place },
  );
  expect(bound, `no Autocomplete bound to #${inputId}`).toBe(true);
}

function input(page: Page, id: string) {
  return page.locator(`#${id}`);
}

test("autocomplete binds every route field and place_changed updates booking state", async ({
  browser,
}) => {
  const { context, page } = await newPage(browser);
  try {
    await openForm(page);
    await waitForBound(page, ["booking-pickup", "booking-dropoff"]);

    await page.getByTestId("route-add-stop").click();
    await page.getByTestId("route-add-stop").click();
    await waitForBound(page, ["booking-stop-0", "booking-stop-1"]);

    await selectPlace(page, "booking-pickup", {
      address: "Genève Aéroport, 1215 Le Grand-Saconnex",
      lat: 46.2381,
      lng: 6.109,
    });
    await selectPlace(page, "booking-stop-0", {
      address: "Nyon, Switzerland",
      lat: 46.3833,
      lng: 6.2395,
    });
    await selectPlace(page, "booking-stop-1", {
      address: "Morges, Switzerland",
      lat: 46.5113,
      lng: 6.4985,
    });
    await selectPlace(page, "booking-dropoff", {
      address: "Lausanne, Switzerland",
      lat: 46.5197,
      lng: 6.6323,
    });

    await expect(input(page, "booking-pickup")).toHaveValue(
      "Genève Aéroport, 1215 Le Grand-Saconnex",
    );
    await expect(input(page, "booking-stop-0")).toHaveValue("Nyon, Switzerland");
    await expect(input(page, "booking-stop-1")).toHaveValue("Morges, Switzerland");
    await expect(input(page, "booking-dropoff")).toHaveValue("Lausanne, Switzerland");

    // The route map receives the picked coordinates and both stops as waypoints.
    await expect
      .poll(() => page.evaluate(() => window.__gm.routeCalls.length), {
        timeout: 20_000,
      })
      .toBeGreaterThan(0);
    const calls = await page.evaluate(() => window.__gm.routeCalls);
    const routeCall = calls[calls.length - 1];
    expect(routeCall.origin).toMatchObject({ lat: 46.2381, lng: 6.109 });
    expect(routeCall.destination).toMatchObject({ lat: 46.5197, lng: 6.6323 });
    expect(routeCall.waypoints).toHaveLength(2);

    // Valid places satisfy step 1: Continue moves to vehicle selection.
    await page.locator("#booking-date").fill("2026-12-20");
    await page.locator("#booking-time").fill("09:30");
    const next = page.getByRole("button", { name: CONTINUE });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.locator(".step-count")).toContainText("2", { timeout: 30_000 });
  } finally {
    await context.close();
  }
});

test("place_changed after removing a stop targets the surviving stop", async ({
  browser,
}) => {
  const { context, page } = await newPage(browser);
  try {
    await openForm(page);
    await waitForBound(page, ["booking-pickup", "booking-dropoff"]);

    await page.getByTestId("route-add-stop").click();
    await page.getByTestId("route-add-stop").click();
    await waitForBound(page, ["booking-stop-0", "booking-stop-1"]);

    const pickup = {
      address: "Genève Aéroport, 1215 Le Grand-Saconnex",
      lat: 46.2381,
      lng: 6.109,
    };
    const firstStop = { address: "Nyon, Switzerland", lat: 46.3833, lng: 6.2395 };
    const secondStop = { address: "Morges, Switzerland", lat: 46.5113, lng: 6.4985 };
    const dropoff = { address: "Lausanne, Switzerland", lat: 46.5197, lng: 6.6323 };

    await selectPlace(page, "booking-pickup", pickup);
    await selectPlace(page, "booking-stop-0", firstStop);
    await selectPlace(page, "booking-stop-1", secondStop);
    await selectPlace(page, "booking-dropoff", dropoff);

    await expect(input(page, "booking-stop-0")).toHaveValue(firstStop.address);
    await expect(input(page, "booking-stop-1")).toHaveValue(secondStop.address);

    // Removing the first stop shifts the second one up into index 0.
    await page
      .getByRole("button", {
        name: message("embeddable.remove-stop").replace("{number}", "1"),
      })
      .click();
    await expect(page.locator("#booking-stop-1")).toHaveCount(0);
    await expect(input(page, "booking-stop-0")).toHaveValue(secondStop.address);

    // The removed row's place_changed listener is unbound.
    await expect
      .poll(() => page.evaluate(() => window.__gm.detachedListenerCount()), {
        timeout: 20_000,
      })
      .toBe(0);

    // place_changed on the surviving stop must fill the (now first) stop, not
    // the index it was bound with while the removed stop still existed.
    const movedStop = { address: "Vevey, Switzerland", lat: 46.4628, lng: 6.8416 };
    await selectPlace(page, "booking-stop-0", movedStop);
    await expect(input(page, "booking-stop-0")).toHaveValue(movedStop.address);

    // Booking state follows: one stop left and it is the newly picked place.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const calls = window.__gm.routeCalls;
            if (calls.length === 0) return null;
            const waypoints = calls[calls.length - 1].waypoints;
            return { count: waypoints.length, first: waypoints[0]?.location ?? null };
          }),
        { timeout: 30_000 },
      )
      .toEqual({ count: 1, first: movedStop.address });
  } finally {
    await context.close();
  }
});

test("service-area errors render beside the field and clear on a valid place", async ({
  browser,
}) => {
  const admin = await browser.newContext({ baseURL: BASE_URL });
  await admin.addCookies(authCookies);
  const saved = await admin.request.post("/api/settings", {
    data: { mapBounds: SERVICE_BOUNDS, mapPolygonPoints: [] },
  });
  expect(saved.ok()).toBe(true);

  const { context, page } = await newPage(browser);
  try {
    await openForm(page);
    await waitForBound(page, ["booking-pickup", "booking-dropoff"]);

    // Pickup outside the configured rectangle.
    await selectPlace(page, "booking-pickup", OUTSIDE_PLACE);
    const pickupError = page.locator("#route-error-pickup");
    await expect(pickupError).toHaveText(OUTSIDE);
    await expect(pickupError).toBeVisible();
    await expect(input(page, "booking-pickup")).toHaveAttribute("aria-invalid", "true");
    await expect(input(page, "booking-pickup")).toHaveAttribute(
      "aria-describedby",
      "route-error-pickup",
    );

    // Picking a place inside the area clears it.
    await selectPlace(page, "booking-pickup", INSIDE);
    await expect(input(page, "booking-pickup")).toHaveValue(INSIDE.address);
    await expect(pickupError).toHaveCount(0);
    await expect(input(page, "booking-pickup")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );

    // Drop-off outside the area reports the error on the drop-off field only.
    await selectPlace(page, "booking-dropoff", OUTSIDE_PLACE);
    const dropoffError = page.locator("#route-error-dropoff");
    await expect(dropoffError).toHaveText(OUTSIDE);
    await expect(input(page, "booking-dropoff")).toHaveAttribute("aria-invalid", "true");
    await expect(input(page, "booking-dropoff")).toHaveAttribute(
      "aria-describedby",
      "route-error-dropoff",
    );
    await expect(input(page, "booking-pickup")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await selectPlace(page, "booking-dropoff", {
      address: "Genève, Switzerland",
      lat: 46.2044,
      lng: 6.1432,
    });
    await expect(input(page, "booking-dropoff")).toHaveValue("Genève, Switzerland");
    await expect(dropoffError).toHaveCount(0);
  } finally {
    const cleanup = await admin.request.post("/api/settings", {
      data: { mapBounds: null, mapPolygonPoints: null },
    });
    expect(cleanup.ok()).toBe(true);
    await admin.close();
    await context.close();
  }
});

test("current location fills pickup from the device position", async ({ browser }) => {
  const { context, page } = await newPage(browser, {
    grantsLocation: true,
    geolocation: { latitude: 46.2, longitude: 6.14 },
  });
  try {
    await openForm(page);
    await waitForBound(page, ["booking-pickup"]);
    await page.getByRole("button", { name: USE_CURRENT_LOCATION }).click();
    await expect(input(page, "booking-pickup")).toHaveValue(REVERSE_ADDRESS, {
      timeout: 30_000,
    });
    await expect(input(page, "booking-pickup")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
  } finally {
    await context.close();
  }
});

test("current location shows the permission-denied error", async ({ browser }) => {
  const { context, page } = await newPage(browser);
  await page.addInitScript(() => {
    const denied = {
      code: 1,
      message: "permission denied",
    } as unknown as GeolocationPositionError;
    const geolocation = {
      getCurrentPosition(
        _success?: PositionCallback,
        error?: PositionErrorCallback | null,
      ) {
        window.setTimeout(() => error?.(denied), 0);
      },
      watchPosition() {
        return 1;
      },
      clearWatch() {
        // No watch is started by the app.
      },
    } as unknown as Geolocation;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: geolocation,
    });
  });
  try {
    await openForm(page);
    await waitForBound(page, ["booking-pickup"]);
    await page.getByRole("button", { name: USE_CURRENT_LOCATION }).click();
    const error = page.locator("#route-error-pickup");
    await expect(error).toHaveText(PERMISSION_DENIED);
    await expect(input(page, "booking-pickup")).toHaveAttribute("aria-invalid", "true");
    await expect(input(page, "booking-pickup")).toHaveAttribute(
      "aria-describedby",
      "route-error-pickup",
    );
  } finally {
    await context.close();
  }
});
