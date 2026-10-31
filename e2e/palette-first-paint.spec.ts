import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";

/** Selected palette primaries, light mode (riviera-palettes.css). */
const SLATE_SIG = "#4652d6";
const SLATE_PAPER = "rgb(246, 247, 249)";

/** Selected palette primaries, dark mode (riviera-palettes.css, slate dark block). */
const SLATE_DARK_SIG = "#8b93f5";
const SLATE_DARK_PAPER = "rgb(14, 16, 22)";

async function signInAndPick(page: Page, palette: string) {
  await signInAdmin(page);
  const res = await page.request.post("/api/settings", { data: { colorPalette: palette } });
  expect(res.ok()).toBe(true);
}

/**
 * Slows the network so first-paint sampling can observe intermediate frames.
 * CDP only exists in Chromium; WebKit gets the same 400ms latency injected at
 * the routing layer, which delays every request before it leaves the page.
 */
async function emulateSlowNetwork(
  browser: Browser,
  context: BrowserContext,
  page: Page,
) {
  if (browser.browserType().name() === "chromium") {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 400,
      downloadThroughput: 50_000,
      uploadThroughput: 20_000,
    });
    return;
  }

  await page.route("**/*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });
}

test.describe.configure({ mode: "serial" });

test("the first HTML response already carries the saved palette", async ({ page, request }) => {
  test.setTimeout(300_000);
  await signInAndPick(page, "slate");
  for (const path of ["/en", "/en/embeddable/v1", "/en/embeddable/v4"]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toMatch(/<html[^>]*data-palette="slate"/);
  }
});

test("without JavaScript the form paints the selected palette", async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL, colorScheme: "light" });
  const page = await ctx.newPage();
  for (const [path, scope] of [["/en", ".riviera"], ["/en/embeddable/v1", ".riviera-embed"]] as const) {
    await page.goto(path, { waitUntil: "commit", timeout: 180_000 });
    await page.locator(scope).first().waitFor({ state: "attached" });
    const sig = await page.locator(scope).first().evaluate((el) => getComputedStyle(el).getPropertyValue("--sig").trim().toLowerCase());
    expect(sig, path).toBe(SLATE_SIG);
  }
  await ctx.close();
});

test("on a throttled network the palette is right at DOMContentLoaded", async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const ctx = await browser.newContext({ baseURL, colorScheme: "light" });
  const page = await ctx.newPage();
  await emulateSlowNetwork(browser, ctx, page);
  await page.addInitScript(() => {
    const w = window as unknown as { __frames: string[] };
    w.__frames = [];
    const sample = () => {
      if (!document.body) return;
      const scope = document.querySelector(".riviera, .riviera-embed") ?? document.documentElement;
      const sig = getComputedStyle(scope).getPropertyValue("--sig").trim().toLowerCase();
      w.__frames.push(`${sig}|${getComputedStyle(document.body).backgroundColor}`);
    };
    document.addEventListener("DOMContentLoaded", sample);
    const tick = () => { sample(); if (w.__frames.length < 400) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  for (const path of ["/en", "/en/embeddable/v1"]) {
    await page.goto(path, { waitUntil: "load", timeout: 280_000 });
    await page.waitForTimeout(1500);
    const frames = await page.evaluate(() => (window as unknown as { __frames: string[] }).__frames);
    expect(frames.length, path).toBeGreaterThan(0);
    expect([...new Set(frames)], path).toEqual([`${SLATE_SIG}|${SLATE_PAPER}`]);
  }
  await ctx.close();
});

test("dark mode first paint uses the selected palette dark tokens", async ({ page, browser, baseURL }) => {
  test.setTimeout(300_000);
  await signInAndPick(page, "slate");
  const ctx = await browser.newContext({ baseURL, colorScheme: "dark" });
  const darkPage = await ctx.newPage();
  await emulateSlowNetwork(browser, ctx, darkPage);
  await darkPage.addInitScript(() => {
    const w = window as unknown as { __frames: string[] };
    w.__frames = [];
    const sample = () => {
      if (!document.body) return;
      const scope = document.querySelector(".riviera, .riviera-embed") ?? document.documentElement;
      const sig = getComputedStyle(scope).getPropertyValue("--sig").trim().toLowerCase();
      w.__frames.push(`${sig}|${getComputedStyle(document.body).backgroundColor}`);
    };
    document.addEventListener("DOMContentLoaded", sample);
    const tick = () => { sample(); if (w.__frames.length < 400) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  for (const path of ["/en", "/en/embeddable/v1"]) {
    await darkPage.goto(path, { waitUntil: "load", timeout: 280_000 });
    await darkPage.waitForTimeout(1500);
    const frames = await darkPage.evaluate(() => (window as unknown as { __frames: string[] }).__frames);
    expect(frames.length, path).toBeGreaterThan(0);
    expect([...new Set(frames)], path).toEqual([`${SLATE_DARK_SIG}|${SLATE_DARK_PAPER}`]);
  }
  await ctx.close();
});
