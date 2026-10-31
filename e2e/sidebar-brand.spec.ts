import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";

/**
 * Sidebar brand lockup: logo + name over subtitle inside one link, at mobile
 * (sheet), tablet and desktop widths in light and dark, plus Arabic RTL.
 * Screenshots land in /workspace/shots and are named
 * sidebar-after-<width>-<mode>.png (sidebar-after-ar-1440.png for Arabic).
 */

test.use({ trace: "off" });

const SHOTS = "/workspace/shots";
const BASE_URL = "http://127.0.0.1:3000";

const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];
const WIDTHS = [390, 768, 1440] as const;

type Cookies = Parameters<BrowserContext["addCookies"]>[0];
let authCookies: Cookies = [];

async function signIn(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  await signInAdmin(page);
  authCookies = await context.cookies();
  await context.close();
}

async function openSidebar(page: Page, width: number) {
  const link = page.locator("a.desk-brand");
  if (width >= 768) {
    await link.waitFor({ state: "visible", timeout: 90_000 });
    return link;
  }

  const trigger = page.locator('[data-sidebar="trigger"]:visible').first();
  const sheet = page.locator('[data-slot="sidebar"][data-mobile="true"]');
  await trigger.waitFor({ state: "visible", timeout: 90_000 });

  // The sidebar renders in desktop mode until useIsMobile's effect runs, so the
  // first tap can land while the trigger still toggles the desktop rail.
  await expect(async () => {
    if (await sheet.isVisible()) return;
    await trigger.click();
    await expect(sheet).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });

  await link.waitFor({ state: "visible", timeout: 60_000 });
  return link;
}

async function openDashboard(
  browser: Browser,
  width: number,
  mode: Mode,
  locale: "en" | "ar" = "en",
) {
  const mobile = width < 768;
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width, height: mobile ? 844 : 900 },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: mobile ? 2 : 1,
    colorScheme: mode,
    locale: "en-US",
  });
  await context.addCookies(authCookies);
  await context.addInitScript((value: string) => {
    try {
      localStorage.setItem("riviera-theme", value);
    } catch {
      // Storage disabled: the page falls back to light.
    }
  }, mode);

  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(180_000);
  await page.goto(`/${locale}/dashboard/home`, {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });

  return { context, page };
}

type Metrics = {
  hasName: boolean;
  hasSub: boolean;
  nameText: string;
  subText: string;
  title: string | null;
  linkHeight: number;
  nameBottom: number | null;
  subTop: number | null;
  logoWidth: number;
  logoHeight: number;
  logoCenter: number | null;
  textCenter: number | null;
  scrollWidth: number;
  viewport: number;
};

async function measure(link: ReturnType<Page["locator"]>): Promise<Metrics> {
  return link.evaluate((el) => {
    const anchor = el as HTMLElement;
    const name = anchor.querySelector<HTMLElement>(".desk-brand__name");
    const sub = anchor.querySelector<HTMLElement>(".desk-brand__sub");
    const logo = anchor.querySelector<HTMLElement>(".desk-brand__logo");
    const linkRect = anchor.getBoundingClientRect();
    const nameRect = name?.getBoundingClientRect();
    const subRect = sub?.getBoundingClientRect();
    const logoRect = logo?.getBoundingClientRect();

    return {
      hasName: Boolean(name && anchor.contains(name)),
      hasSub: Boolean(sub && anchor.contains(sub)),
      nameText: name?.textContent?.trim() ?? "",
      subText: sub?.textContent?.trim() ?? "",
      title: name?.getAttribute("title") ?? null,
      linkHeight: linkRect.height,
      nameBottom: nameRect?.bottom ?? null,
      subTop: subRect?.top ?? null,
      logoWidth: logoRect?.width ?? 0,
      logoHeight: logoRect?.height ?? 0,
      logoCenter: logoRect ? logoRect.top + logoRect.height / 2 : null,
      textCenter:
        nameRect && subRect ? (nameRect.top + subRect.bottom) / 2 : null,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    };
  });
}

async function assertLockup(link: ReturnType<Page["locator"]>) {
  const metrics = await measure(link);

  expect(metrics.hasName, "brand name is inside the link").toBe(true);
  expect(metrics.hasSub, "subtitle is inside the same link").toBe(true);
  expect(metrics.nameText.length).toBeGreaterThan(0);
  expect(metrics.subText.length).toBeGreaterThan(0);
  expect(metrics.title).toBe(metrics.nameText);

  expect(metrics.linkHeight).toBeGreaterThanOrEqual(44);

  expect(metrics.subTop).not.toBeNull();
  expect(metrics.nameBottom).not.toBeNull();
  const stackGap = (metrics.subTop ?? 0) - (metrics.nameBottom ?? 0);
  expect(stackGap, "subtitle sits right below the name").toBeGreaterThanOrEqual(-1);
  expect(stackGap, "subtitle sits right below the name").toBeLessThanOrEqual(4);

  expect(metrics.logoWidth).toBeGreaterThanOrEqual(28);
  expect(metrics.logoHeight).toBeGreaterThanOrEqual(28);
  expect(metrics.logoCenter).not.toBeNull();
  expect(metrics.textCenter).not.toBeNull();
  expect(
    Math.abs((metrics.logoCenter ?? 0) - (metrics.textCenter ?? 0)),
    "logo is vertically centred with the text block",
  ).toBeLessThanOrEqual(4);

  expect(metrics.scrollWidth, "no horizontal overflow").toBeLessThanOrEqual(
    metrics.viewport + 1,
  );

  return metrics;
}

async function screenshotHeader(page: Page, file: string) {
  mkdirSync(SHOTS, { recursive: true });
  const header = page.locator('[data-slot="sidebar-header"]:visible').first();
  await header.waitFor({ state: "visible", timeout: 30_000 });
  await header.screenshot({ path: join(SHOTS, file) });
}

test.beforeAll(async ({ browser }) => {
  mkdirSync(SHOTS, { recursive: true });
  await signIn(browser);
});

for (const mode of MODES) {
  for (const width of WIDTHS) {
    test(`brand lockup ${width}px ${mode}`, async ({ browser }) => {
      test.setTimeout(300_000);
      const { context, page } = await openDashboard(browser, width, mode);

      try {
        const link = await openSidebar(page, width);
        await assertLockup(link);
        await screenshotHeader(page, `sidebar-after-${width}-${mode}.png`);
      } finally {
        await context.close();
      }
    });
  }
}

test("brand lockup arabic rtl 1440px", async ({ browser }) => {
  test.setTimeout(300_000);
  const { context, page } = await openDashboard(browser, 1440, "light", "ar");

  try {
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const link = await openSidebar(page, 1440);
    await assertLockup(link);
    await screenshotHeader(page, "sidebar-after-ar-1440.png");
  } finally {
    await context.close();
  }
});
