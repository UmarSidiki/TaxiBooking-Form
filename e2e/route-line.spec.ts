import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";

const SHOTS = "/workspace/shots";

const WIDTHS = [320, 390, 768, 1440, 1920] as const;
const MODES = ["light", "dark"] as const;
const LOCALES = [
  { path: "/en", suffix: "" },
  { path: "/ar", suffix: "-ar" },
] as const;
const STOP_COUNTS = [0, 1, 2] as const;

type Cookies = Parameters<BrowserContext["addCookies"]>[0];
let authCookies: Cookies = [];

async function openRoute(page: Page) {
  await page.locator(".riviera").first().waitFor({ state: "visible", timeout: 120_000 });
  await expect(page.locator("#booking-pickup")).toBeVisible({ timeout: 120_000 });
}

async function addStop(page: Page, expectedMarkers: number) {
  await page.getByTestId("route-add-stop").click();
  await expect(page.locator("[data-route-marker]")).toHaveCount(expectedMarkers);
}

type MarkerBox = {
  type: string;
  text: string;
  centerX: number;
  centerY: number;
};

type RouteGeometry = {
  rail: { top: number; bottom: number; centerX: number } | null;
  markers: MarkerBox[];
  overflow: number;
};

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  await signInAdmin(page);
  const response = await page.request.post("/api/settings", {
    data: { colorPalette: "neutral" },
  });
  expect(response.ok()).toBe(true);
  authCookies = await context.cookies();
  await context.close();
});

for (const width of WIDTHS) {
  for (const mode of MODES) {
    for (const locale of LOCALES) {
      for (const stops of STOP_COUNTS) {
        test(`route rail ${width} ${mode} ${locale.path} ${stops} stops`, async ({
          browser,
          baseURL,
        }) => {
          test.setTimeout(300_000);
          const mobile = width < 768;
          const context = await browser.newContext({
            baseURL,
            viewport: { width, height: mobile ? 844 : 900 },
            isMobile: mobile,
            hasTouch: mobile,
            deviceScaleFactor: mobile ? 2 : 1,
            colorScheme: mode,
            reducedMotion: "reduce",
          });
          await context.addCookies(authCookies);
          const page = await context.newPage();
          page.setDefaultTimeout(60_000);
          page.setDefaultNavigationTimeout(180_000);
          await page.addInitScript((theme: string) => {
            try {
              localStorage.setItem("riviera-theme", theme);
            } catch {
              // Storage-disabled contexts keep the light default.
            }
          }, mode);

          try {
            await page.goto(locale.path, { waitUntil: "domcontentloaded" });
            await openRoute(page);

            for (let index = 0; index < stops; index += 1) {
              await addStop(page, 2 + index + 1);
            }
            await expect(page.locator("[data-route-marker]")).toHaveCount(2 + stops);

            const geometry = await page.evaluate((): RouteGeometry => {
              const rail = document.querySelector<HTMLElement>('[data-testid="route-rail"]');
              const markers = Array.from(
                document.querySelectorAll<HTMLElement>("[data-route-marker]"),
              );
              const railRect = rail?.getBoundingClientRect() ?? null;
              return {
                rail: railRect
                  ? {
                      top: railRect.top,
                      bottom: railRect.bottom,
                      centerX: railRect.left + railRect.width / 2,
                    }
                  : null,
                markers: markers.map((marker) => {
                  const rect = marker.getBoundingClientRect();
                  return {
                    type: marker.dataset.routeMarker ?? "",
                    text: marker.textContent?.trim() ?? "",
                    centerX: rect.left + rect.width / 2,
                    centerY: rect.top + rect.height / 2,
                  };
                }),
                overflow: document.documentElement.scrollWidth - window.innerWidth,
              };
            });

            expect(geometry.rail).not.toBeNull();
            if (!geometry.rail) throw new Error("route rail line is missing");
            const rail = geometry.rail;
            const first = geometry.markers[0];
            const last = geometry.markers[geometry.markers.length - 1];

            expect(geometry.markers).toHaveLength(2 + stops);
            expect(geometry.markers.filter((marker) => marker.type === "pickup")).toHaveLength(1);
            expect(geometry.markers.filter((marker) => marker.type === "dropoff")).toHaveLength(1);
            expect(
              geometry.markers
                .filter((marker) => marker.type === "stop")
                .map((marker) => marker.text),
            ).toEqual(stops === 0 ? [] : Array.from({ length: stops }, (_, index) => `${index + 1}`));

            expect(rail.top).toBeLessThanOrEqual(first.centerY + 1);
            expect(rail.bottom).toBeGreaterThanOrEqual(last.centerY - 1);
            for (const marker of geometry.markers) {
              expect(Math.abs(marker.centerX - rail.centerX)).toBeLessThanOrEqual(2);
            }
            expect(geometry.overflow).toBeLessThanOrEqual(1);

            // Markers sit inside their field; pickup/drop-off fields span the full rail width.
            const inside = await page.evaluate(() => {
              const railBox = document.querySelector(".route-rail")!.getBoundingClientRect();
              return {
                railWidth: railBox.width,
                markers: Array.from(document.querySelectorAll<HTMLElement>("[data-route-marker]")).map((marker) => {
                  const field = marker.closest(".route-rail__field");
                  const m = marker.getBoundingClientRect();
                  const f = field?.getBoundingClientRect();
                  return {
                    type: marker.dataset.routeMarker ?? "",
                    inField: Boolean(f && m.left >= f.left - 0.5 && m.right <= f.right + 0.5 && m.top >= f.top - 0.5 && m.bottom <= f.bottom + 0.5),
                    fieldWidth: f?.width ?? 0,
                  };
                }),
              };
            });
            for (const marker of inside.markers) {
              expect(marker.inField).toBe(true);
              if (marker.type !== "stop") {
                expect(Math.abs(marker.fieldWidth - inside.railWidth)).toBeLessThanOrEqual(1);
              }
            }

            const addBox = await page.getByTestId("route-add-stop").boundingBox();
            expect(addBox?.width ?? 0).toBeGreaterThanOrEqual(44);
            expect(addBox?.height ?? 0).toBeGreaterThanOrEqual(44);

            const removes = page.getByTestId("route-remove-stop");
            await expect(removes).toHaveCount(stops);
            for (let index = 0; index < stops; index += 1) {
              const box = await removes.nth(index).boundingBox();
              expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
              expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
            }

            const waits = page.getByTestId("route-stop-wait");
            await expect(waits).toHaveCount(stops);
            for (let index = 0; index < stops; index += 1) {
              const wait = waits.nth(index);
              const box = await wait.boundingBox();
              // Stop row: address 75% / wait 25% on one line.
              const row = await wait.evaluate((select) => {
                const stop = select.closest(".route-rail__stop")!;
                const field = stop.querySelector(".route-rail__field")!.getBoundingClientRect();
                const waitBox = stop.querySelector(".route-rail__wait")!.getBoundingClientRect();
                return { ratio: field.width / (field.width + waitBox.width), sameLine: Math.abs(field.top - waitBox.top) <= 1 };
              });
              expect(row.sameLine).toBe(true);
              expect(Math.abs(row.ratio - 0.75)).toBeLessThanOrEqual(0.02);
              expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
              await expect(wait).toHaveValue("0");
              await wait.selectOption("15");
              await expect(wait).toHaveValue("15");
            }

            mkdirSync(SHOTS, { recursive: true });
            await page.screenshot({
              path: join(
                SHOTS,
                `step1-built-route-${width}-${stops}stop-${mode}${locale.suffix}.png`,
              ),
              fullPage: true,
            });
          } finally {
            await context.close();
          }
        });
      }
    }
  }
}
