import { expect, test, devices, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";
import { configureE2eDatabase } from "./helpers/login-token";
import { PALETTE_PRESETS } from "../src/features/settings/lib/palette-presets";

/**
 * Dark mode: every admin sidebar label, group label and icon must read at
 * WCAG AA (4.5:1) against the sidebar it sits on, for every preset and a
 * custom palette, on the desktop rail and the mobile drawer (LTR and RTL).
 */
type Cookies = Parameters<BrowserContext["addCookies"]>[0];
const SHOTS = process.env.SHOTS_DIR ?? "/workspace/shots";
let admin: Cookies = [];
test.describe.configure({ mode: "serial" });
test.use({ trace: "off" });

async function setPalette(data: Record<string, unknown>) {
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  await db.collection("settings").updateOne({}, { $set: data }, { upsert: true });
}

test.beforeAll(async ({ browser, baseURL }) => {
  const c = await browser.newContext({ baseURL });
  const p = await c.newPage();
  p.setDefaultTimeout(120_000);
  await signInAdmin(p);
  admin = await c.cookies();
  await c.close();
});
test.afterAll(async () => setPalette({ colorPalette: "neutral" }));

async function open(browser: Browser, baseURL: string | undefined, opts: Record<string, unknown>, path: string) {
  const { defaultBrowserType: _d, ...rest } = opts as Record<string, unknown> & { defaultBrowserType?: string };
  const ctx = await browser.newContext({ ...rest, baseURL, colorScheme: "dark", reducedMotion: "reduce" });
  await ctx.addInitScript(() => localStorage.setItem("riviera-theme", "dark"));
  await ctx.addCookies(admin);
  const page = await ctx.newPage();
  page.setDefaultTimeout(90_000);
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 180_000 });
  return { ctx, page };
}

async function sidebarNav(page: Page, mobile: boolean) {
  const nav = page.locator('nav[aria-label]:has([data-nav-group]):visible').first();
  if (mobile) {
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
  await page.waitForTimeout(500);
  return nav;
}

/** Lowest contrast across links, icons and group labels, each against its painted backdrop. */
async function worst(page: Page) {
  return page.locator('nav[aria-label]:has([data-nav-group]):visible').first().evaluate((root) => {
    const parse = (c: string) => {
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.fillStyle = "#000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const over = (top: number[], bot: number[]) => [0, 1, 2].map((i) => top[i] * top[3] + bot[i] * (1 - top[3]));
    const backdrop = (el: Element) => {
      const layers: number[][] = [];
      for (let n: Element | null = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
      }
      let acc = [255, 255, 255];
      for (const l of layers.reverse()) acc = over(l, acc);
      return acc;
    };
    const ratio = (el: Element, colour: string) => {
      const bg = backdrop(el);
      const cs = getComputedStyle(el);
      const fg = over([...parse(colour).slice(0, 3), parse(colour)[3] * Number(cs.opacity)], bg);
      const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      return (a + 0.05) / (b + 0.05);
    };
    const out: { what: string; ratio: number }[] = [];
    root.querySelectorAll("a span, [data-sidebar='group-label']").forEach((el) => {
      out.push({ what: `text:${el.textContent?.trim()}`, ratio: ratio(el, getComputedStyle(el).color) });
    });
    root.querySelectorAll("a svg").forEach((el) => {
      let o = 1;
      for (let n: Element | null = el; n && n !== root; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
      const c = parse(getComputedStyle(el).color);
      const bg = backdrop(el.parentElement!);
      const fg = over([c[0], c[1], c[2], c[3] * o], bg);
      const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      out.push({ what: `icon:${el.closest("a")?.textContent?.trim()}`, ratio: (a + 0.05) / (b + 0.05) });
    });
    out.sort((x, y) => x.ratio - y.ratio);
    return { count: out.length, min: out[0] };
  });
}

const PALETTES: Array<{ name: string; data: Record<string, unknown> }> = [
  ...Object.keys(PALETTE_PRESETS).map((name) => ({ name, data: { colorPalette: name } })),
  { name: "custom", data: { colorPalette: "custom", customPalette: { brand: "#1E3A8A", accent: "#0F766E" } } },
];

const VIEWS = [
  { name: "1440", opts: { viewport: { width: 1440, height: 900 } }, mobile: false, path: "/en/dashboard/home" },
  { name: "390", opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, mobile: true, path: "/en/dashboard/home" },
  { name: "rtl-390", opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, mobile: true, path: "/ar/dashboard/home" },
  { name: "android", opts: { ...devices["Pixel 7"] }, mobile: true, path: "/en/dashboard/home", engine: "chromium" },
  { name: "ios", opts: { ...devices["iPhone 13"] }, mobile: true, path: "/en/dashboard/home", engine: "webkit" },
];

for (const pal of PALETTES) {
  test(`dark sidebar contrast >= 4.5 — ${pal.name}`, async ({ browser, browserName, baseURL }) => {
    await setPalette(pal.data);
    for (const v of VIEWS) {
      if (v.engine && v.engine !== browserName) continue;
      const { ctx, page } = await open(browser, baseURL, v.opts, v.path);
      await sidebarNav(page, v.mobile);
      const r = await worst(page);
      expect(r.count, `${pal.name} ${v.name}: measured nothing`).toBeGreaterThan(10);
      expect(r.min.ratio, `${pal.name} ${v.name}: ${r.min.what}`).toBeGreaterThanOrEqual(4.5);
      if (pal.name === "neutral" && ["1440", "390"].includes(v.name) && browserName === "chromium")
        await page.screenshot({ path: `${SHOTS}/sidebar-dark-${v.name}.png` });
      if (pal.name === "neutral" && v.name === "android") await page.screenshot({ path: `${SHOTS}/sidebar-dark-android.png` });
      if (pal.name === "neutral" && v.name === "ios") await page.screenshot({ path: `${SHOTS}/sidebar-dark-ios.png` });
      await ctx.close();
    }
  });
}
