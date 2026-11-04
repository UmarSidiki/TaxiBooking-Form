import { expect, test, devices } from "@playwright/test";

/** Step 1 compact mobile layout: everything up to the CTA fits a phone with little scrolling,
 *  the dock never covers a field, no sideways scroll, add-stop sits on the route rail. */
const TAG = process.env.COMPACT_TAG ?? "after";
const cases: Array<{ name: string; path: string; opts: Record<string, unknown>; engine?: string; dark?: boolean }> = [
  ...[320, 360, 390, 430, 768, 1440].map((w) => ({ name: `${w}`, path: "/en", opts: { viewport: { width: w, height: w < 768 ? 844 : 900 }, isMobile: w < 768, hasTouch: w < 768 } })),
  { name: "android", path: "/en", opts: { ...devices["Pixel 7"] }, engine: "chromium" },
  { name: "ios", path: "/en", opts: { ...devices["iPhone 13"] }, engine: "webkit" },
  { name: "rtl", path: "/ar", opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  { name: "dark-390", path: "/de", opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, dark: true },
];

for (const c of cases) {
  test(`step1 compact ${c.name}`, async ({ browser, browserName, baseURL }) => {
    test.skip(Boolean(c.engine) && c.engine !== browserName, "engine-specific");
    const { defaultBrowserType: _d, ...opts } = c.opts as Record<string, unknown> & { defaultBrowserType?: string };
    const ctx = await browser.newContext({ ...opts, baseURL, colorScheme: c.dark ? "dark" : "light", reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(c.path, { waitUntil: "domcontentloaded", timeout: 180_000 });
    await expect(page.locator("#booking-pickup")).toBeVisible({ timeout: 120_000 });
    await page.screenshot({ path: `/workspace/shots/step1-compact-${c.name}-${TAG}-empty.png`, fullPage: true });
    await page.getByTestId("route-add-stop").click();
    await expect(page.locator("[data-route-marker]")).toHaveCount(3);
    const g = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      const cta = r("main .btn-primary");
      const dock = r(".dock");
      const add = r('[data-testid="route-add-stop"]');
      const stop = r(".route-rail__stop");
      const drop = r("#booking-dropoff");
      const line = r('[data-testid="route-rail"]');
      const fields = Array.from(document.querySelectorAll<HTMLElement>("main .route-rail__field, main input, main select, main .seg button")).map((e) => e.getBoundingClientRect().height).filter((h) => h > 0);
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        ctaBottomDoc: cta.bottom + window.scrollY,
        docH: document.documentElement.scrollHeight,
        vh: window.innerHeight, dockTop: dock.top, dockH: dock.height,
        addBetween: add.top >= stop.bottom - 1 && add.bottom <= drop.top + 60,
        addW: add.width, addH: add.height,
        lineCrossesAdd: line.left < add.right && line.right > add.left,
        minField: Math.min(...fields),
      };
    });
    console.log(`[compact ${TAG}] ${c.name} ${browserName}`, JSON.stringify(g));
    expect(g.overflow).toBeLessThanOrEqual(1);
    expect(g.addW).toBeGreaterThanOrEqual(44);
    expect(g.addH).toBeGreaterThanOrEqual(44);
    if (TAG === "after") {
      expect(g.addBetween).toBe(true);
      expect(g.minField).toBeGreaterThanOrEqual(43.5);
    }
    // Scroll to the bottom: the CTA must sit fully above the dock.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const ov = await page.evaluate(() => {
      const dock = document.querySelector(".dock")!.getBoundingClientRect();
      const cta = document.querySelector("main .btn-primary")!.getBoundingClientRect();
      return cta.bottom <= dock.top + 0.5 || cta.top >= dock.bottom;
    });
    expect(ov).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/workspace/shots/step1-compact-${c.name}${TAG === "after" ? "" : "-" + TAG}.png` });
    await ctx.close();
  });
}
