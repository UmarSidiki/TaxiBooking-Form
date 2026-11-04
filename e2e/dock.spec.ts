import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";

const SHOTS = "/workspace/shots";
const BASE_URL = "http://127.0.0.1:3000";

const VISUAL_WIDTHS = [320, 360, 390, 412, 430, 768, 1024, 1280, 1440, 1920] as const;
const MODES = ["light", "dark"] as const;
const RTL_WIDTHS = [390, 1440] as const;

/** The hard requirement: phones must never hide a control behind the dock. */
const PHONE_WIDTHS = [320, 360, 375, 390, 412, 430] as const;
const PHONE_HEIGHTS = [568, 932] as const;
const STOP_COUNTS = [0, 1, 2] as const;

type Cookies = Parameters<BrowserContext["addCookies"]>[0];
let authCookies: Cookies = [];

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  await signInAdmin(page);
  const response = await page.request.post("/api/settings", {
    data: { colorPalette: "neutral", companyLogoUrl: "" },
  });
  expect(response.ok()).toBe(true);
  authCookies = await context.cookies();
  await context.close();
});

async function newPage(
  browser: Browser,
  {
    width,
    height,
    mode = "light",
    locale = "/en",
  }: { width: number; height: number; mode?: "light" | "dark"; locale?: string },
) {
  const mobile = width < 768;
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: mobile ? 2 : 1,
    colorScheme: mode,
    reducedMotion: "reduce",
  });
  await context.addCookies(authCookies);
  const page = await context.newPage();
  page.setDefaultTimeout(90_000);
  page.setDefaultNavigationTimeout(180_000);
  await page.addInitScript((theme: string) => {
    try {
      localStorage.setItem("riviera-theme", theme);
    } catch {
      // Storage-disabled contexts keep the default.
    }
  }, mode);
  return { context, page, mobile };
}

async function openForm(page: Page, locale = "/en") {
  await page.goto(locale, { waitUntil: "domcontentloaded" });
  await page.locator(".riviera").first().waitFor({ state: "visible", timeout: 120_000 });
  await expect(page.locator("#booking-pickup")).toBeVisible({ timeout: 120_000 });
  await expect(page.locator(".riviera .dock")).toBeVisible({ timeout: 30_000 });
}

async function addStops(page: Page, count: number) {
  for (let index = 0; index < count; index += 1) {
    await page.getByTestId("route-add-stop").click();
  }
  await expect(page.locator("[data-route-marker]")).toHaveCount(2 + count);
}

async function goToVehicles(page: Page) {
  await page.locator("#booking-pickup").fill("Geneva Airport");
  await page.locator("#booking-dropoff").fill("Lausanne Station");
  await page.locator("#booking-date").fill("2026-12-25");
  await page.locator("#booking-time").fill("12:00");
  await page.keyboard.press("Escape");
  const next = page.locator("main .btn-primary").first();
  await expect(next).toBeEnabled({ timeout: 90_000 });
  await next.click();
  await expect(page.locator("main .veh .pick").first()).toBeVisible({ timeout: 90_000 });
}

async function goToPayment(page: Page) {
  await page.locator("main .veh .pick").first().click();
  await expect(page.locator("main #promo-code")).toBeVisible({ timeout: 90_000 });
}

type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type Item = { label: string; box: Box; fullyInView: boolean };

type Layout = {
  dock: Box | null;
  map: Box | null;
  viewportHeight: number;
  reserve: number;
  items: Item[];
  overlapping: string[];
  covered: string[];
};

function readLayout(page: Page): Promise<Layout> {
  return page.evaluate(() => {
    const toBox = (rect: DOMRect) => ({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
    const dock = document.querySelector<HTMLElement>(".riviera .dock");
    if (!dock) {
      return {
        dock: null,
        map: null,
        viewportHeight: window.innerHeight,
        reserve: 0,
        items: [],
        overlapping: [],
        covered: [],
      };
    }
    const main = document.querySelector<HTMLElement>(".riviera main");
    const map = document.querySelector<HTMLElement>(".riviera .map");
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    };
    const dockBox = dock.getBoundingClientRect();
    const overlapsDock = (box: Box) =>
      box.left < dockBox.right - 1 &&
      box.right > dockBox.left + 1 &&
      box.top < dockBox.bottom - 1 &&
      box.bottom > dockBox.top + 1;

    const items: Item[] = Array.from(
      (main ?? document.body).querySelectorAll<HTMLElement>(
        "input, select, textarea, button, a, [role=combobox]"
      )
    )
      .filter(visible)
      .map((element) => {
        const box = toBox(element.getBoundingClientRect());
        const label = (
          element.getAttribute("aria-label") ||
          element.id ||
          element.textContent ||
          element.tagName
        )
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 48);
        return {
          label: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""} "${label}"`,
          box,
          fullyInView:
            box.top >= 0 &&
            box.left >= 0 &&
            box.bottom <= window.innerHeight &&
            box.right <= window.innerWidth,
        };
      });

    return {
      dock: toBox(dockBox),
      map: map ? toBox(map.getBoundingClientRect()) : null,
      viewportHeight: window.innerHeight,
      reserve: main ? Number.parseFloat(getComputedStyle(main).paddingBottom) : 0,
      items,
      overlapping: items.filter((item) => overlapsDock(item.box)).map((item) => item.label),
      // A viewport-fixed dock floats over whatever scrolls beneath it; the
      // guarantee is that everything fully above the dock stays clear of it and
      // every control is reachable again by scrolling (see the reserve check).
      covered: items
        .filter(
          (item) =>
            item.fullyInView &&
            item.box.bottom <= dockBox.top + 1 &&
            overlapsDock(item.box)
        )
        .map((item) => item.label),
    };
  });
}

async function scrollTo(page: Page, bottom: boolean) {
  await page.evaluate((toBottom) => {
    window.scrollTo(0, toBottom ? document.documentElement.scrollHeight : 0);
  }, bottom);
  await page.waitForTimeout(120);
}

/** Dock items are 44px tall; no field can sit under the dock at any scroll position. */
async function auditDock(page: Page, step: number, width: number) {
  await scrollTo(page, true);
  const atBottom = await readLayout(page);
  expect(atBottom.dock, `step ${step}: dock is missing`).not.toBeNull();
  expect(atBottom.overlapping, `step ${step} bottom scroll covers form controls`).toEqual([]);
  expect(
    atBottom.reserve,
    `step ${step}: sheet padding reserves less room than the dock`
  ).toBeGreaterThanOrEqual((atBottom.dock?.height ?? 0) + 4);

  await scrollTo(page, false);
  const atTop = await readLayout(page);
  expect(atTop.covered, `step ${step} initial scroll covers form controls`).toEqual([]);

  const dockBox = atTop.dock;
  if (!dockBox) throw new Error(`step ${step}: dock is missing`);
  expect(dockBox.height).toBeGreaterThanOrEqual(44);
  if (width < 1024) {
    // Mobile and tablet: full width minus the 12px insets, glued to the bottom.
    expect(Math.abs(dockBox.left - 12)).toBeLessThanOrEqual(1);
    expect(Math.abs(dockBox.right - (width - 12))).toBeLessThanOrEqual(1);
    expect(Math.abs(atTop.viewportHeight - dockBox.bottom - 12)).toBeLessThanOrEqual(1);
  } else if (step === 1) {
    expect(atTop.map, "desktop step 1 has no map panel").not.toBeNull();
    if (atTop.map) {
      expect(dockBox.left).toBeGreaterThanOrEqual(atTop.map.left - 1);
      expect(dockBox.right).toBeLessThanOrEqual(atTop.map.right + 1);
      expect(dockBox.top).toBeGreaterThanOrEqual(atTop.map.top - 1);
      expect(dockBox.bottom).toBeLessThanOrEqual(atTop.map.bottom + 1);
      expect(Math.abs(atTop.map.bottom - dockBox.bottom - 28)).toBeLessThanOrEqual(1);
    }
  }

  return { atBottom, atTop };
}

async function auditDockItems(page: Page) {
  const boxes = await page.evaluate(() => {
    const dock = document.querySelector<HTMLElement>(".riviera .dock");
    if (!dock) return null;
    const controls = Array.from(
      dock.querySelectorAll<HTMLElement>(".dock-logo, .dock-controls button, .dock-controls a")
    );
    return controls.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        name: element.getAttribute("aria-label") || element.tagName,
        width: rect.width,
        height: rect.height,
      };
    });
  });
  expect(boxes, "dock controls are missing").not.toBeNull();
  for (const item of boxes ?? []) {
    expect(item.height, `${item.name} is shorter than 44px`).toBeGreaterThanOrEqual(44);
    expect(item.width, `${item.name} is narrower than 44px`).toBeGreaterThanOrEqual(44);
  }
}

function intersects(
  a: Pick<Box, "left" | "top" | "right" | "bottom">,
  b: Pick<Box, "left" | "top" | "right" | "bottom">
) {
  return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
}

async function revealControl(page: Page, selector: ReturnType<Page["locator"]>) {
  await selector.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(80);
  const dock = await page.locator(".riviera .dock").boundingBox();
  const box = await selector.boundingBox();
  if (!dock || !box) throw new Error("control or dock is not rendered");
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(
    intersects(
      { left: box.x, top: box.y, right: box.x + box.width, bottom: box.y + box.height },
      { left: dock.x, top: dock.y, right: dock.x + dock.width, bottom: dock.y + dock.height }
    ),
    "the dock hides a control that is scrolled into view"
  ).toBe(false);
}

/** Add a stop and the Transfer / Hourly switch stay visible and unobstructed. */
async function auditStep1Toggles(page: Page) {
  const addStop = page.getByTestId("route-add-stop");
  await expect(addStop).toBeVisible();
  await revealControl(page, addStop);

  // The first segmented control is the Transfer / Hourly booking type switch.
  const toggles = page.locator("main .seg").first().getByRole("radio");
  const count = await toggles.count();
  expect(count).toBeGreaterThanOrEqual(2);
  for (let index = 0; index < count; index += 1) {
    await expect(toggles.nth(index)).toBeVisible();
    await revealControl(page, toggles.nth(index));
  }
  await scrollTo(page, false);
}

/* ------------------------------------------------------------------ */
/* Wide logo fixture: 400x100 (4:1) solid PNG, generated in memory.    */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function wideLogoDataUrl() {
  const width = 400;
  const height = 100;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  const stride = 1 + width * 3;
  const row = Buffer.alloc(stride);
  for (let x = 0; x < width; x += 1) {
    row[1 + x * 3] = 37;
    row[1 + x * 3 + 1] = 99;
    row[1 + x * 3 + 2] = 235;
  }
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) row.copy(raw, y * stride);

  return `data:image/png;base64,${Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]).toString("base64")}`;
}

/* ------------------------------------------------------------------ */
/* Layout across every target width, mode and step.                    */
/* ------------------------------------------------------------------ */

for (const width of VISUAL_WIDTHS) {
  for (const mode of MODES) {
    test(`dock ${width} ${mode} steps 1-3`, async ({ browser }) => {
      test.setTimeout(300_000);
      const mobile = width < 768;
      const { context, page } = await newPage(browser, {
        width,
        height: mobile ? 844 : 900,
        mode,
      });
      try {
        await openForm(page);
        await auditDockItems(page);
        await auditStep1Toggles(page);
        await auditDock(page, 1, width);

        mkdirSync(SHOTS, { recursive: true });
        await page.screenshot({
          path: join(SHOTS, `step1-built-dock-${width}-${mode}.png`),
        });
        if (mode === "light" && (width === 390 || width === 1440)) {
          await page.screenshot({
            path: join(SHOTS, `step1-built-brand-${width}-light.png`),
          });
        }

        await goToVehicles(page);
        await auditDockItems(page);
        await auditDock(page, 2, width);

        await goToPayment(page);
        await auditDockItems(page);
        await auditDock(page, 3, width);
      } finally {
        await context.close();
      }
    });
  }
}

for (const width of RTL_WIDTHS) {
  test(`dock ${width} arabic rtl`, async ({ browser }) => {
    test.setTimeout(300_000);
    const mobile = width < 768;
    const { context, page } = await newPage(browser, {
      width,
      height: mobile ? 844 : 900,
      locale: "/ar",
    });
    try {
      await openForm(page, "/ar");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await auditDockItems(page);
      await auditStep1Toggles(page);
      await auditDock(page, 1, width);

      mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({
        path: join(SHOTS, `step1-built-dock-${width}-light-ar.png`),
      });

      const dock = await page.locator(".riviera .dock").boundingBox();
      const logo = await page.getByTestId("dock-logo").boundingBox();
      const controls = await page.locator(".dock-controls").boundingBox();
      const map = await page.locator(".riviera .map").boundingBox();
      if (dock && logo && controls) {
        // RTL mirrors the dock: the plate sits at the right edge, controls at the left.
        expect(Math.abs(logo.x + logo.width - (dock.x + dock.width - 7))).toBeLessThanOrEqual(2);
        expect(Math.abs(controls.x - (dock.x + 7))).toBeLessThanOrEqual(2);
        // Text plates size to their content; the 44-140px cap is for image logos.
        expect(logo.width).toBeGreaterThanOrEqual(44);
      }
      if (width >= 1024 && dock && map) {
        // The dock stays centred inside the map panel in RTL as well.
        const dockCentre = dock.x + dock.width / 2;
        const mapCentre = map.x + map.width / 2;
        expect(Math.abs(dockCentre - mapCentre)).toBeLessThanOrEqual(2);
      }

      await goToVehicles(page);
      await auditDock(page, 2, width);
      await goToPayment(page);
      await auditDock(page, 3, width);
    } finally {
      await context.close();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Brand text plate: full company name from tablet up, dock inside its   */
/* panel, and no horizontal overflow at any target width.                */
/* ------------------------------------------------------------------ */

const BRAND_WIDTHS = [768, 1024, 1280, 1440, 1920] as const;

type BrandSnapshot = {
  dock: Box;
  plate: Box;
  map: Box | null;
  viewport: { width: number; height: number };
  name: { text: string; scrollWidth: number; clientWidth: number };
  overflowX: number;
};

function readBrand(page: Page): Promise<BrandSnapshot | null> {
  return page.evaluate(() => {
    const toBox = (rect: DOMRect) => ({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
    const dock = document.querySelector<HTMLElement>(".riviera .dock");
    const plate = document.querySelector<HTMLElement>(".riviera .dock-logo--text");
    const name = plate?.querySelector<HTMLElement>(".dock-logo__name");
    if (!dock || !plate || !name) return null;
    const map = document.querySelector<HTMLElement>(".riviera .map");
    return {
      dock: toBox(dock.getBoundingClientRect()),
      plate: toBox(plate.getBoundingClientRect()),
      map: map ? toBox(map.getBoundingClientRect()) : null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      name: {
        text: (name.textContent ?? "").trim(),
        scrollWidth: name.scrollWidth,
        clientWidth: name.clientWidth,
      },
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
}

for (const width of BRAND_WIDTHS) {
  test(`brand text plate shows the full name at ${width}px`, async ({ browser }) => {
    test.setTimeout(300_000);
    const { context, page } = await newPage(browser, {
      width,
      height: 900,
      mode: "light",
    });
    try {
      await openForm(page);
      const brand = await readBrand(page);
      expect(brand, "brand text plate is not rendered").not.toBeNull();
      if (!brand) throw new Error("brand text plate is not rendered");

      expect(brand.name.text.length).toBeGreaterThan(0);
      expect(
        brand.name.scrollWidth,
        `brand "${brand.name.text}" is truncated at ${width}px`
      ).toBeLessThanOrEqual(brand.name.clientWidth + 1);
      expect(brand.plate.width).toBeGreaterThanOrEqual(44);

      // No horizontal overflow, and the dock stays inside the viewport.
      expect(brand.overflowX).toBeLessThanOrEqual(1);
      expect(brand.dock.left).toBeGreaterThanOrEqual(0);
      expect(brand.dock.right).toBeLessThanOrEqual(brand.viewport.width + 1);

      if (width >= 1024) {
        expect(brand.map, "desktop step 1 has no map panel").not.toBeNull();
        if (brand.map) {
          expect(brand.dock.left).toBeGreaterThanOrEqual(brand.map.left - 1);
          expect(brand.dock.right).toBeLessThanOrEqual(brand.map.right + 1);
          expect(brand.dock.top).toBeGreaterThanOrEqual(brand.map.top - 1);
          expect(brand.dock.bottom).toBeLessThanOrEqual(brand.map.bottom + 1);
          expect(Math.abs(brand.map.bottom - brand.dock.bottom - 28)).toBeLessThanOrEqual(1);
        }
      } else {
        // Tablet keeps the phone-style full-width dock glued to the bottom.
        expect(Math.abs(brand.dock.left - 12)).toBeLessThanOrEqual(1);
        expect(Math.abs(brand.dock.right - (width - 12))).toBeLessThanOrEqual(1);
        expect(Math.abs(brand.viewport.height - brand.dock.bottom - 12)).toBeLessThanOrEqual(1);
      }

      if (width === 1440) {
        mkdirSync(SHOTS, { recursive: true });
        await page.screenshot({
          path: join(SHOTS, "step1-built-brand-1440-light.png"),
        });
      }
    } finally {
      await context.close();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Hard requirement: phones never hide a control, any stops/step/scroll */
/* ------------------------------------------------------------------ */

for (const width of PHONE_WIDTHS) {
  test(`dock never covers the form at ${width}px`, async ({ browser }) => {
    test.setTimeout(900_000);
    const heights = PHONE_HEIGHTS;
    for (const height of heights) {
      for (const stops of STOP_COUNTS) {
        const { context, page } = await newPage(browser, { width, height });
        try {
          await openForm(page);
          await addStops(page, stops);
          await auditStep1Toggles(page);
          await auditDock(page, 1, width);

          await goToVehicles(page);
          await auditDock(page, 2, width);

          await goToPayment(page);
          await auditDock(page, 3, width);
        } finally {
          await context.close();
        }
      }
    }
  });
}

/* ------------------------------------------------------------------ */
/* Logo plate                                                          */
/* ------------------------------------------------------------------ */

for (const width of [390, 1440] as const) {
  test(`logo plate renders a wide logo undistorted at ${width}px`, async ({ browser }) => {
    test.setTimeout(300_000);
    const admin = await browser.newContext({ baseURL: BASE_URL });
    await admin.addCookies(authCookies);
    const logo = wideLogoDataUrl();
    const saved = await admin.request.post("/api/settings", {
      data: { companyLogoUrl: logo },
    });
    expect(saved.ok()).toBe(true);

    const mobile = width < 768;
    const { context, page } = await newPage(browser, {
      width,
      height: mobile ? 844 : 900,
    });
    try {
      await page.goto("/en", { waitUntil: "domcontentloaded" });
      await page.locator(".riviera .dock").waitFor({ state: "visible", timeout: 120_000 });
      const plate = page.getByTestId("dock-logo");
      const img = plate.locator("img");
      await expect(img).toBeVisible({ timeout: 60_000 });
      await expect
        .poll(() => img.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0), {
          timeout: 30_000,
        })
        .toBe(true);

      const metrics = await page.evaluate(() => {
        const plateElement = document.querySelector<HTMLElement>('[data-testid="dock-logo"]');
        const image = plateElement?.querySelector<HTMLImageElement>("img");
        if (!plateElement || !image) return null;
        const plateBox = plateElement.getBoundingClientRect();
        const imageBox = image.getBoundingClientRect();
        const style = getComputedStyle(image);
        return {
          plate: {
            width: plateBox.width,
            height: plateBox.height,
            left: plateBox.left,
            right: plateBox.right,
            top: plateBox.top,
            bottom: plateBox.bottom,
          },
          image: {
            width: imageBox.width,
            height: imageBox.height,
            left: imageBox.left,
            right: imageBox.right,
            top: imageBox.top,
            bottom: imageBox.bottom,
          },
          natural: { width: image.naturalWidth, height: image.naturalHeight },
          objectFit: style.objectFit,
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      expect(metrics).not.toBeNull();
      if (!metrics) throw new Error("logo plate is not rendered");

      expect(metrics.natural.width / metrics.natural.height).toBeCloseTo(4, 2);
      expect(metrics.objectFit).toBe("contain");
      expect(metrics.plate.height).toBeGreaterThanOrEqual(44);
      expect(metrics.plate.width).toBeGreaterThanOrEqual(44);
      expect(metrics.plate.width).toBeLessThanOrEqual(140.5);
      // A 4:1 logo wants 176px at 44px tall; the plate caps it at 140.
      expect(metrics.plate.width).toBeGreaterThan(120);

      // The image is fully inside its plate - nothing cropped.
      expect(metrics.image.left).toBeGreaterThanOrEqual(metrics.plate.left - 1);
      expect(metrics.image.right).toBeLessThanOrEqual(metrics.plate.right + 1);
      expect(metrics.image.top).toBeGreaterThanOrEqual(metrics.plate.top - 1);
      expect(metrics.image.bottom).toBeLessThanOrEqual(metrics.plate.bottom + 1);
      expect(metrics.image.height).toBeGreaterThanOrEqual(metrics.plate.height - 2);

      // Contain + the real natural ratio means the painted logo keeps 4:1.
      const contentWidth = Math.min(
        metrics.image.width,
        metrics.image.height * (metrics.natural.width / metrics.natural.height)
      );
      const contentHeight = contentWidth / (metrics.natural.width / metrics.natural.height);
      expect(contentHeight).toBeLessThanOrEqual(metrics.image.height + 0.5);
      expect(contentWidth).toBeGreaterThan(0.9 * metrics.image.width);
      expect(metrics.overflowX).toBeLessThanOrEqual(1);

      await page.screenshot({
        path: join(SHOTS, `step1-built-dock-logo-${width}.png`),
      });
    } finally {
      const reset = await admin.request.post("/api/settings", {
        data: { companyLogoUrl: "" },
      });
      expect(reset.ok()).toBe(true);
      await context.close();
      await admin.close();
    }
  });
}
