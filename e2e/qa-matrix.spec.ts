import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { PALETTE_IDS, PALETTE_MODES, paletteSignature, type PaletteId, type PaletteMode } from "./helpers/palette-tokens";
import { signInAdmin } from "./helpers/sign-in";

const SHOTS = "/workspace/shots/qa";
const BASE_URL = "http://127.0.0.1:3000";

type Messages = { [key: string]: string | Messages };

const EN_MESSAGES = JSON.parse(readFileSync(join(process.cwd(), "messages/en.json"), "utf8")) as Messages;

function message(key: string): string {
  let node: string | Messages = EN_MESSAGES;
  for (const part of key.split(".")) {
    if (typeof node === "string") break;
    node = node[part] ?? "";
  }
  if (typeof node !== "string" || node.length === 0) throw new Error(`messages/en.json has no "${key}"`);
  return node;
}

const PICKUP_REQUIRED = message("Step1.pickup-location-is-required");
const LOCATION_DENIED = message("Step1.location-permission-denied");
const LOCATION_TIMEOUT = message("Step1.location-timeout");
const ADDRESS_NOT_FOUND = message("Step1.location-address-not-found");
const USE_CURRENT_LOCATION = message("Step1.use-current-location");

type SummaryRow = { test: string; pass: boolean; violations: string[] };

const summary: SummaryRow[] = [];
let violations: string[] = [];

function writeSummary() {
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(join(SHOTS, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

const VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 360, height: 844 },
  { width: 390, height: 844 },
  { width: 412, height: 844 },
  { width: 430, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1280, height: 900 },
  { width: 1440, height: 900 },
  { width: 1920, height: 900 },
] as const;

type Cookies = Parameters<BrowserContext["addCookies"]>[0];
let authCookies: Cookies = [];

test.describe.configure({ mode: "serial" });

test.beforeEach(() => {
  violations = [];
});

test.afterEach(({}, testInfo) => {
  const row: SummaryRow = {
    test: `${testInfo.project.name} :: ${testInfo.title}`,
    pass: testInfo.status === "passed",
    violations: [...violations],
  };
  if (!row.pass && row.violations.length === 0) {
    const firstLine = testInfo.error?.message?.split("\n")[0]?.trim();
    if (firstLine) row.violations.push(firstLine);
  }
  summary.push(row);
  writeSummary();
});

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  await signInAdmin(page);
  authCookies = await context.cookies();
  await context.close();
});

async function openBrowser(
  browser: Browser,
  width: number,
  height: number,
  mobile: boolean,
  colorScheme: PaletteMode = "light",
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: mobile ? 2 : 1,
    colorScheme,
  });
  await context.addCookies(authCookies);
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);
  page.setDefaultNavigationTimeout(180_000);
  return { context, page };
}

async function selectPalette(page: Page, palette: PaletteId) {
  const response = await page.request.post("/api/settings", { data: { colorPalette: palette } });
  expect(response.ok(), `POST /api/settings colorPalette=${palette} -> ${response.status()}`).toBe(true);
}

async function setThemeStorage(page: Page, mode: PaletteMode) {
  await page.addInitScript((value: string) => {
    try {
      localStorage.setItem("riviera-theme", value);
    } catch {
      // Sandboxed or storage-disabled contexts keep the light default.
    }
  }, mode);
}

async function openForm(page: Page) {
  await page.goto("/en", { waitUntil: "domcontentloaded", timeout: 180_000 });
  await page.locator(".riviera").first().waitFor({ state: "visible", timeout: 120_000 });
  await expect(page.getByPlaceholder("Enter pickup address")).toBeVisible({ timeout: 90_000 });
}

async function screenshot(page: Page, file: string) {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, file) });
}

type AuditParams = { step: number; width: number };

/**
 * Layout checks shared by every step: overflow, 44px targets, clipped text,
 * map presence, dock placement and fleet image integrity.
 */
async function auditLayout(page: Page, step: number, width: number): Promise<string[]> {
  const params: AuditParams = { step, width };
  return page.evaluate(({ step: currentStep, width: viewportWidth }: AuditParams) => {
    const issues: string[] = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const describe = (el: Element) => {
      const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
      const text = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 40);
      return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls ? `.${cls}` : ""} "${text}"`;
    };
    const isVisible = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };

    const doc = document.documentElement;
    if (doc.scrollWidth > vw + 1) issues.push(`horizontal-overflow: scrollWidth ${doc.scrollWidth} > viewport ${vw}`);

    const main = document.querySelector("main") ?? document.body;

    // (2) Tap targets: 44x44, or inline text links at 44x24.
    for (const el of Array.from(main.querySelectorAll<HTMLElement>("button, a, input, [role=radio], [role=tab]"))) {
      if (!isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const inlineTextLink = el.tagName === "A" && style.display.startsWith("inline");
      const bigEnough = rect.width >= 44 && rect.height >= 44;
      const linkEnough = inlineTextLink && rect.width >= 44 && rect.height >= 24;
      // A checkbox's target is its wrapping label; the 16px glyph itself is fine
      // when the label it toggles is at least 44px.
      const isCheckbox = el.getAttribute("role") === "checkbox" || (el as HTMLInputElement).type === "checkbox";
      const label = isCheckbox ? el.closest("label") : null;
      const labelBox = label?.getBoundingClientRect();
      const labelEnough = Boolean(labelBox && labelBox.width >= 44 && labelBox.height >= 44);
      if (!bigEnough && !linkEnough && !labelEnough) {
        issues.push(`tap-target: ${Math.round(rect.width)}x${Math.round(rect.height)} ${describe(el)}`);
      }
    }

    // (3) Clipped text without an ellipsis.
    for (const el of Array.from(main.querySelectorAll<HTMLElement>("*"))) {
      if (!isVisible(el) || el.getAttribute("aria-hidden") === "true") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) continue;
      if (!(el.textContent ?? "").trim()) continue;
      const style = getComputedStyle(el);
      if (style.overflowX === "hidden" && style.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 1) {
        issues.push(`clipped-text: ${el.scrollWidth}px > ${el.clientWidth}px in ${describe(el)}`);
      }
    }

    // (5) Map presence. Step 1 shows it from 1024px; steps 2-3 never do.
    const map = document.querySelector<HTMLElement>(".riviera .map");
    if (currentStep === 1 && viewportWidth >= 1024) {
      if (!map) {
        issues.push("map: step 1 at desktop has no .riviera .map panel");
      } else if (!isVisible(map)) {
        issues.push("map: the step 1 map panel is not visible");
      } else if (!map.querySelector('[aria-label="Route map"], .map-fallback')) {
        issues.push("map: the step 1 panel has neither a Google map nor the route-map fallback");
      }
    }
    if (currentStep >= 2 && map) issues.push(`map: step ${currentStep} must not render a map`);

    // (6) Dock placement.
    const dock = document.querySelector<HTMLElement>(".riviera .dock");
    const intersects = (a: DOMRect, b: DOMRect) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    if (dock) {
      const d = dock.getBoundingClientRect();
      if (viewportWidth < 768) {
        if (Math.abs(d.bottom - vh) > 24) {
          issues.push(`dock: bottom ${Math.round(d.bottom)} is not at the viewport bottom ${vh} on mobile`);
        }
        if (map && intersects(d, map.getBoundingClientRect())) issues.push("dock: overlaps the map on mobile");
      }
      if (viewportWidth >= 1024 && currentStep === 1 && map) {
        const mapRect = map.getBoundingClientRect();
        if (Math.abs(d.bottom - (mapRect.bottom - 16)) > 24) {
          issues.push(
            `dock: desktop dock bottom ${Math.round(d.bottom)} is not inside the map panel bottom ${Math.round(mapRect.bottom)}`,
          );
        }
      }
    }

    // (7) Fleet images.
    if (currentStep === 2) {
      const arts = Array.from(main.querySelectorAll<HTMLElement>(".veh .art"));
      for (const art of arts) {
        if (!art.querySelector("img, svg")) issues.push("fleet-image: a vehicle art slot has no image or fallback art");
      }
      for (const img of Array.from(main.querySelectorAll<HTMLImageElement>(".veh img"))) {
        const rect = img.getBoundingClientRect();
        if (!img.complete || img.naturalWidth === 0) {
          issues.push(`fleet-image: not loaded ${img.currentSrc || img.src}`);
          continue;
        }
        const fit = getComputedStyle(img).objectFit;
        if (fit === "fill" && rect.width > 0 && rect.height > 0) {
          const naturalRatio = img.naturalWidth / img.naturalHeight;
          const renderedRatio = rect.width / rect.height;
          if (Math.abs(naturalRatio - renderedRatio) / naturalRatio > 0.05) {
            issues.push(`fleet-image: fill distorts ${describe(img)} (${naturalRatio.toFixed(2)} vs ${renderedRatio.toFixed(2)})`);
          }
        }
      }
    }

    return issues;
  }, params);
}

/**
 * (4) The floating dock must not cover the primary action or form fields. A fixed
 * dock sits at the bottom, so the page is scrolled to its end where a covering
 * dock is actually a problem.
 */
async function auditDockOverlap(page: Page): Promise<string[]> {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(150);
  const issues = await page.evaluate(() => {
    const found: string[] = [];
    const dock = document.querySelector<HTMLElement>(".riviera .dock");
    if (!dock) return found;
    const main = document.querySelector("main") ?? document.body;
    const d = dock.getBoundingClientRect();
    for (const el of Array.from(main.querySelectorAll<HTMLElement>("input, select, [role=radio], .btn-primary"))) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (rect.width <= 0 || rect.height <= 0 || style.display === "none" || style.visibility === "hidden") continue;
      if (rect.left < d.right && rect.right > d.left && rect.top < d.bottom && rect.bottom > d.top) {
        const label = (el.getAttribute("aria-label") || el.id || el.textContent || el.tagName).replace(/\s+/g, " ").trim().slice(0, 40);
        found.push(`dock-overlap: ${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} "${label}"`);
      }
    }
    return found;
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  return issues;
}

async function audit(page: Page, step: number, width: number): Promise<string[]> {
  return [...(await auditLayout(page, step, width)), ...(await auditDockOverlap(page))];
}

async function fillTrip(page: Page) {
  await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
  await page.getByPlaceholder("Enter destination address").fill("Lausanne Station");
  await page.locator('input[type="date"]').first().fill("2026-12-25");
  await page.locator('input[type="time"]').first().fill("12:00");
  await page.locator('input[type="time"]').first().blur();
  await page.keyboard.press("Escape");
}

async function continueToVehicles(page: Page) {
  const next = page.getByRole("button", { name: "Continue", exact: true });
  await expect(next).toBeEnabled({ timeout: 90_000 });
  await next.click();
  await expect(page.getByRole("button", { name: "Select", exact: true }).first()).toBeVisible({ timeout: 90_000 });
}

async function selectFirstVehicle(page: Page) {
  await page.getByRole("button", { name: "Select", exact: true }).first().click();
  await expect(page.getByLabel("Promo code")).toBeVisible({ timeout: 90_000 });
}

test.describe("A. layout regression (neutral light, en)", () => {
  for (const { width, height } of VIEWPORTS) {
    test(`layout ${width}px`, async ({ browser }, testInfo) => {
      test.setTimeout(300_000);
      const project = testInfo.project.name;
      const mobile = width < 768;
      const { context, page } = await openBrowser(browser, width, height, mobile);

      try {
        await selectPalette(page, "neutral");
        await setThemeStorage(page, "light");
        await openForm(page);
        await page.waitForTimeout(1_200);

        violations.push(...(await audit(page, 1, width)));
        await screenshot(page, `${project}-${width}-step1.png`);

        await fillTrip(page);
        await continueToVehicles(page);
        await page.waitForTimeout(1_200);
        violations.push(...(await audit(page, 2, width)));
        await screenshot(page, `${project}-${width}-step2.png`);

        await selectFirstVehicle(page);
        await page.waitForTimeout(1_200);
        violations.push(...(await audit(page, 3, width)));
        await screenshot(page, `${project}-${width}-step3.png`);
      } finally {
        await context.close();
      }

      expect(violations).toEqual([]);
    });
  }
});

test.describe("B. palettes (light/dark, form + embed)", () => {
  for (const palette of PALETTE_IDS) {
    for (const mode of PALETTE_MODES) {
      for (const width of [390, 1280] as const) {
        test(`palette ${palette} ${mode} ${width}px`, async ({ browser }) => {
          test.setTimeout(300_000);
          const mobile = width < 768;
          const { context, page } = await openBrowser(browser, width, mobile ? 844 : 900, mobile, mode);

          try {
            await selectPalette(page, palette);
            await setThemeStorage(page, mode);

            const expected = paletteSignature(palette, mode);
            const pages = [
              { path: "/en", scope: ".riviera", suffix: "" },
              { path: "/en/embeddable/v1", scope: ".riviera-embed", suffix: "-embed" },
            ] as const;

            for (const target of pages) {
              await page.goto(target.path, { waitUntil: "domcontentloaded", timeout: 180_000 });
              const scope = page.locator(target.scope).first();
              await scope.waitFor({ state: "visible", timeout: 120_000 });
              await page.waitForTimeout(800);

              await expect
                .poll(
                  async () =>
                    (await scope.evaluate((el) => getComputedStyle(el).getPropertyValue("--sig").trim().toLowerCase())),
                  { timeout: 30_000, message: `${target.path} --sig` },
                )
                .toBe(expected);

              const axe = await new AxeBuilder({ page })
                .exclude("nextjs-portal")
                .withTags(["wcag2aa"])
                .analyze();
              for (const violation of axe.violations) {
                if (violation.id !== "color-contrast") continue;
                if (violation.impact !== "serious" && violation.impact !== "critical") continue;
                const targets = violation.nodes.slice(0, 3).map((node) => node.target.join(" ")).join(" | ");
                violations.push(`${target.path}: color-contrast (${violation.nodes.length} nodes) ${targets}`);
              }

              await screenshot(page, `palette-${palette}-${mode}-${width}${target.suffix}.png`);
            }
          } finally {
            await context.close();
          }

          expect(violations).toEqual([]);
        });
      }
    }
  }
});

test.describe("C. Arabic RTL", () => {
  for (const width of [390, 1280] as const) {
    test(`arabic rtl ${width}px`, async ({ browser }, testInfo) => {
      test.setTimeout(300_000);
      const project = testInfo.project.name;
      const mobile = width < 768;
      const { context, page } = await openBrowser(browser, width, mobile ? 844 : 900, mobile);

      try {
        await selectPalette(page, "neutral");
        await setThemeStorage(page, "light");
        await page.goto("/ar", { waitUntil: "domcontentloaded", timeout: 180_000 });
        await page.locator(".riviera").first().waitFor({ state: "visible", timeout: 120_000 });
        await page.waitForTimeout(1_200);

        await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        if (metrics.scrollWidth > metrics.innerWidth + 1) {
          violations.push(`horizontal-overflow: scrollWidth ${metrics.scrollWidth} > viewport ${metrics.innerWidth}`);
        }
        await screenshot(page, `${project}-ar-${width}-step1.png`);
      } finally {
        await context.close();
      }

      expect(violations).toEqual([]);
    });
  }
});

type GeoScenario = "grant" | "deny" | "timeout";

async function mockGeolocation(page: Page, scenario: GeoScenario) {
  await page.addInitScript((mode: string) => {
    const failure = (code: number) =>
      ({ code, message: "qa mock", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }) as unknown as GeolocationPositionError;
    const position = {
      coords: {
        latitude: 46.2,
        longitude: 6.1,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: Date.now(),
    } as unknown as GeolocationPosition;
    const geolocation = {
      getCurrentPosition(
        success?: PositionCallback,
        error?: PositionErrorCallback | null,
      ) {
        window.setTimeout(() => {
          if (mode === "grant") success?.(position);
          else error?.(failure(mode === "deny" ? 1 : 3));
        }, 0);
      },
      watchPosition() {
        return 1;
      },
      clearWatch() {
        // No watch started in the mock.
      },
    } as unknown as Geolocation;
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: geolocation });
  }, scenario);
}

test.describe("D. geolocation", () => {
  for (const scenario of ["grant", "deny", "timeout"] as const) {
    test(`current location ${scenario}`, async ({ browser }) => {
      test.setTimeout(300_000);
      const { context, page } = await openBrowser(browser, 390, 844, true);

      try {
        await selectPalette(page, "neutral");
        await setThemeStorage(page, "light");
        await mockGeolocation(page, scenario);
        await openForm(page);

        await page.getByRole("button", { name: USE_CURRENT_LOCATION }).click();

        if (scenario === "deny") {
          await expect(page.getByText(LOCATION_DENIED)).toBeVisible({ timeout: 30_000 });
        } else if (scenario === "timeout") {
          await expect(page.getByText(LOCATION_TIMEOUT)).toBeVisible({ timeout: 45_000 });
        } else {
          await expect
            .poll(
              async () => {
                if ((await page.locator("#booking-pickup").inputValue()).trim()) return "filled";
                if (await page.getByText(ADDRESS_NOT_FOUND).isVisible().catch(() => false)) return "address-not-found";
                if (await page.getByText(LOCATION_DENIED).isVisible().catch(() => false)) return "permission-denied";
                if (await page.getByText(LOCATION_TIMEOUT).isVisible().catch(() => false)) return "timeout";
                return "pending";
              },
              { timeout: 60_000, intervals: [500, 1_000] },
            )
            .toMatch(/filled|address-not-found/);
        }
      } finally {
        await context.close();
      }
    });
  }
});

test("E. keyboard focus rings on step 1", async ({ browser }) => {
  test.setTimeout(300_000);
  const { context, page } = await openBrowser(browser, 390, 844, true);

  try {
    await selectPalette(page, "neutral");
    await setThemeStorage(page, "light");
    await openForm(page);

    // The Next dev-tools indicator is a shadow-DOM portal, not app UI. Axe
    // excludes it too; drop it so it does not consume one of the eight tabs.
    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((portal) => portal.remove());
    });

    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press("Tab");
      const focus = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const style = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id,
          label: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 40),
          outline: `${style.outlineStyle} ${style.outlineWidth}`,
          outlineVisible: style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) >= 2,
          shadowVisible: style.boxShadow !== "none",
        };
      });
      if (!focus) {
        violations.push(`focus-ring: tab ${index + 1} found no active element`);
        continue;
      }
      if (focus.tag === "nextjs-portal") {
        violations.push(`focus-ring: tab ${index + 1} landed on the Next.js dev portal, not app UI`);
        continue;
      }
      if (!focus.outlineVisible && !focus.shadowVisible) {
        violations.push(
          `focus-ring: tab ${index + 1} on ${focus.tag}${focus.id ? `#${focus.id}` : ""} "${focus.label}" (outline ${focus.outline}, no box-shadow)`,
        );
      }
    }
  } finally {
    await context.close();
  }

  expect(violations).toEqual([]);
});

test("F. empty required errors and loading state", async ({ browser }) => {
  test.setTimeout(300_000);
  const { context, page } = await openBrowser(browser, 390, 844, true);

  try {
    await selectPalette(page, "neutral");
    await setThemeStorage(page, "light");
    await openForm(page);

    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByText(PICKUP_REQUIRED)).toBeVisible({ timeout: 30_000 });
    await screenshot(page, `${test.info().project.name}-required-errors.png`);
  } finally {
    await context.close();
  }

  const loadingSource = readFileSync(join(process.cwd(), "src/app/[locale]/loading.tsx"), "utf8");
  expect(loadingSource).toContain('className="riviera');
  expect(loadingSource).toContain("riviera-loading");
  expect(violations).toEqual([]);
});
