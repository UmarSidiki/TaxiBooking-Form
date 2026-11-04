import { expect, test, devices, type Page } from "@playwright/test";

/** Shared spacing scale across booking Steps 1-3: card padding 20, heading-to-content and
 *  card-section gaps 16, label-to-input 6, support rows tight. Shots for light/dark/RTL. */
const TAG = process.env.SPACING_TAG ?? "after";
const WIDTHS = [320, 390, 768, 1440];
const variants = [
  { name: "light", path: "/en", dark: false },
  { name: "dark", path: "/en", dark: true },
  { name: "rtl", path: "/ar", dark: false },
] as const;

async function shoot(page: Page, step: string, variant: string, browserName: string) {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: w < 768 ? 844 : 900 });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${step} ${variant} ${w} sideways scroll`).toBeLessThanOrEqual(1);
    const suffix = browserName === "webkit" ? "-webkit" : "";
    await page.screenshot({ path: `/workspace/shots/spacing-${TAG}-${step}-${variant}-${w}${suffix}.png`, fullPage: true });
  }
}

for (const v of variants) {
  test(`booking spacing ${v.name}`, async ({ browser, browserName, baseURL }) => {
    test.setTimeout(300_000);
    const ctx = await browser.newContext({ baseURL, colorScheme: v.dark ? "dark" : "light", reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(v.path, { waitUntil: "domcontentloaded", timeout: 180_000 });
    await expect(page.locator("#booking-pickup")).toBeVisible({ timeout: 120_000 });
    await page.locator("#booking-pickup").fill("Geneva Airport");
    await page.locator("#booking-dropoff").fill("Lausanne Station");
    await page.locator('input[type="date"]').first().fill("2030-03-10");
    await page.locator('input[type="time"]').first().fill("12:00");
    await page.locator('input[type="time"]').first().blur();
    await page.keyboard.press("Escape");
    await shoot(page, "step1", v.name, browserName);

    await page.setViewportSize({ width: 1440, height: 900 });
    const next = page.locator("main .btn-primary");
    await expect(next).toBeEnabled({ timeout: 90_000 });
    await next.click();
    await expect(page.locator(".veh").first()).toBeVisible({ timeout: 90_000 });
    await shoot(page, "step2", v.name, browserName);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator(".veh button").first().click();
    await expect(page.locator("#promo-code")).toBeVisible({ timeout: 90_000 });
    await shoot(page, "step3", v.name, browserName);

    if (TAG === "after") {
      await page.setViewportSize({ width: 390, height: 844 });
      const g = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll<HTMLElement>('main [data-slot="card"]'));
        const support = Array.from(document.querySelectorAll<HTMLAnchorElement>('main a[href^="mailto:"], main a[href^="tel:"]'));
        return {
          pads: cards.map((c) => parseFloat(getComputedStyle(c).paddingTop)),
          gaps: cards.map((c) => parseFloat(getComputedStyle(c).rowGap)),
          supportRows: support.map((a) => a.getBoundingClientRect().height),
        };
      });
      for (const p of g.pads) expect(p).toBe(20);
      for (const gap of g.gaps) expect(gap).toBe(16);
      for (const h of g.supportRows) expect(h).toBeLessThanOrEqual(36);
    }
    await ctx.close();
  });
}

test("booking spacing android + ios", async ({ browser, browserName, baseURL }) => {
  const dev = browserName === "webkit" ? devices["iPhone 13"] : devices["Pixel 7"];
  const { defaultBrowserType: _d, ...opts } = dev;
  const ctx = await browser.newContext({ ...opts, baseURL, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  test.setTimeout(240_000);
  await page.goto("/en", { waitUntil: "domcontentloaded", timeout: 180_000 });
  await expect(page.locator("#booking-pickup")).toBeVisible({ timeout: 120_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `/workspace/shots/spacing-${TAG}-device-${browserName === "webkit" ? "ios" : "android"}.png`, fullPage: true });
  await ctx.close();
});
