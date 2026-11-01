import { devices, expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";

/**
 * Grouped admin sidebar: section labels, one aria-current link per page
 * (nested routes included), Marketing group holds overview + campaigns +
 * settings, no horizontal overflow from 320 to 1920, LTR and RTL.
 */
test.use({ trace: "off" });
const SHOTS = "/workspace/shots";
type Cookies = Parameters<BrowserContext["addCookies"]>[0];
let cookies: Cookies = [];

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  const page = await ctx.newPage();
  page.setDefaultTimeout(120_000);
  await signInAdmin(page);
  cookies = await ctx.cookies();
  await ctx.close();
});

async function open(browser: Browser, path: string, opts: Parameters<Browser["newContext"]>[0]) {
  const ctx = await browser.newContext({ baseURL: "http://127.0.0.1:3000", ...opts });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();
  page.setDefaultTimeout(90_000);
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 180_000 });
  return { ctx, page };
}

async function ensureSidebar(page: Page, width: number) {
  const nav = page.locator('nav[aria-label]:has([data-nav-group="marketing"]):visible');
  if (width < 768) {
    const trigger = page.locator('[data-sidebar="trigger"]:visible').first();
    const sheet = page.locator('[data-slot="sidebar"][data-mobile="true"]');
    await trigger.waitFor({ state: "visible", timeout: 90_000 });
    await expect(async () => {
      if (await sheet.isVisible()) return;
      await trigger.click();
      await expect(sheet).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 60_000 });
  }
  await nav.waitFor({ state: "visible", timeout: 90_000 });
  if (width < 768) {
    // Let the sheet finish sliding in before measuring or capturing.
    await expect(async () => {
      const box = await nav.boundingBox();
      const dir = await page.evaluate(() => document.documentElement.dir);
      expect(box).not.toBeNull();
      if (dir === "rtl") expect(Math.round(box!.x + box!.width)).toBeGreaterThanOrEqual(width - 24);
      else expect(Math.round(box!.x)).toBeLessThanOrEqual(24);
    }).toPass({ timeout: 10_000 });
    await page.waitForTimeout(400);
  }
  return nav;
}

const ACTIVE: [string, string][] = [
  ["/en/dashboard/home", "/en/dashboard/home"],
  ["/en/dashboard/marketing/campaigns/new", "/en/dashboard/marketing/campaigns"],
  ["/en/dashboard/settings/marketing", "/en/dashboard/settings/marketing"],
  ["/en/dashboard/customers/audit", "/en/dashboard/customers/audit"],
  ["/en/dashboard/settings/email", "/en/dashboard/settings"],
];

for (const [path, want] of ACTIVE) {
  test(`exactly one current link on ${path}`, async ({ browser }) => {
    const { ctx, page } = await open(browser, path, { viewport: { width: 1440, height: 900 } });
    const nav = await ensureSidebar(page, 1440);
    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", want);
    await ctx.close();
  });
}

test("marketing group lists overview, campaigns, settings and is labelled", async ({ browser }) => {
  const { ctx, page } = await open(browser, "/en/dashboard/marketing", { viewport: { width: 1440, height: 900 } });
  const nav = await ensureSidebar(page, 1440);
  const group = nav.locator('[data-nav-group="marketing"]');
  const list = group.getByRole("list", { name: "Marketing" });
  await expect(list.getByRole("link")).toHaveText(["Overview", "Campaigns", "Marketing settings"]);
  const labels = await nav.locator('[data-sidebar="group-label"]').allInnerTexts();
  expect(labels.map((l) => l.trim().toLowerCase())).toEqual(
    expect.arrayContaining(["overview", "operations", "customers", "marketing", "booking site", "system"]),
  );
  // keyboard: Tab reaches the sidebar links
  await nav.getByRole("link", { name: "Campaigns" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/marketing\/campaigns$/);
  await ctx.close();
});

const SIZES = [320, 390, 768, 1024, 1440, 1920];
for (const width of SIZES) {
  for (const locale of ["en", "ar"] as const) {
    test(`fits at ${width} ${locale}`, async ({ browser }) => {
      const mobile = width < 768;
      const { ctx, page } = await open(browser, `/${locale}/dashboard/marketing/campaigns`, {
        viewport: { width, height: mobile ? 844 : 900 },
        isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1,
      });
      const nav = await ensureSidebar(page, width);
      await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      if (locale === "ar") {
        expect(await page.evaluate(() => document.documentElement.dir)).toBe("rtl");
        const box = await nav.boundingBox();
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeGreaterThan(width / 2);
      }
      const name = { 1440: "1440", 390: "390" }[width as 1440 | 390];
      if (name && locale === "en") await page.screenshot({ path: `${SHOTS}/sidebar-v2-${name}.png` });
      if (width === 1440 && locale === "ar") await page.screenshot({ path: `${SHOTS}/sidebar-v2-rtl.png` });
      await ctx.close();
    });
  }
}

for (const [label, device] of [["android", devices["Pixel 7"]], ["ios", devices["iPhone 13"]]] as const) {
  test(`${label} drawer`, async ({ browser, browserName }) => {
    test.skip(label === "ios" && browserName !== "webkit", "iPhone profile runs on WebKit");
    test.skip(label === "android" && browserName !== "chromium", "Pixel profile runs on Chromium");
    const { defaultBrowserType: _d, ...opts } = device;
    const { ctx, page } = await open(browser, "/en/dashboard/marketing/campaigns/new", opts);
    const nav = await ensureSidebar(page, 390);
    await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute("href", "/en/dashboard/marketing/campaigns");
    await page.screenshot({ path: `${SHOTS}/sidebar-v2-${label}.png` });
    await nav.getByRole("link", { name: "All customers" }).tap();
    await page.waitForURL(/dashboard\/customers$/);
    await ctx.close();
  });
}
