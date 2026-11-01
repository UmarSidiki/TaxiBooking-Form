import { expect, test, devices, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";
import { configureE2eDatabase, seedMagicLink } from "./helpers/login-token";
import { derivePalette } from "../src/features/settings/lib/palette-tokens";

type Cookies = Parameters<BrowserContext["addCookies"]>[0];
const SHOTS = process.env.SHOTS_DIR ?? "/workspace/shots";
let admin: Cookies = [];
let ipSeq = 0;
test.describe.configure({ mode: "serial" });

async function setPalette(data: Record<string, unknown>) {
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  await db.collection("settings").updateOne({}, { $set: data }, { upsert: true });
}

async function ensureCustomer() {
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  await db.collection("customerprofiles").updateOne({ email: "ada@example.com" }, { $set: { email: "ada@example.com" } }, { upsert: true });
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

async function ctxFor(browser: Browser, baseURL: string | undefined, opts: Record<string, unknown>, scheme: "light" | "dark") {
  const { defaultBrowserType: _d, ...rest } = opts as Record<string, unknown> & { defaultBrowserType?: string };
  const ctx = await browser.newContext({ ...rest, baseURL, colorScheme: scheme, reducedMotion: "reduce" });
  await ctx.addInitScript((s) => localStorage.setItem("riviera-theme", s), scheme);
  ipSeq += 1;
  await ctx.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${(ipSeq % 200) + 20}` });
  return ctx;
}

async function surfaces(page: Page, scope: string) {
  return page.locator(scope).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    const v = (k: string) => cs.getPropertyValue(k).trim().toUpperCase();
    const input = el.querySelector<HTMLElement>('[data-slot="input"], .route-rail__field, textarea, select');
    const card = el.querySelector<HTMLElement>('[data-slot="card"], .desk-card, .acct-card, .route-rail__field');
    return {
      paper: v("--paper"), sheet: v("--sheet"), field: v("--field"),
      inputBg: input ? getComputedStyle(input).backgroundColor : null,
      cardBg: card ? getComputedStyle(card).backgroundColor : null,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

function rgb(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
}

const PAGES = [
  { name: "form", path: "/en", scope: ".riviera", ready: "#booking-pickup" },
  { name: "dashboard", path: "/en/dashboard", scope: ".riviera", ready: "main" },
  { name: "custom-editor", path: "/en/dashboard/settings/appearance", scope: ".riviera", ready: '[data-testid="custom-palette-editor"]' },
  { name: "account", path: "/en/account", scope: ".riviera", ready: '[data-account-section="overview"]' },
] as const;

const VIEWS: Array<{ name: string; opts: Record<string, unknown>; engine?: string; locale?: string }> = [
  { name: "390", opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  { name: "1440", opts: { viewport: { width: 1440, height: 900 } } },
  { name: "pixel7", opts: { ...devices["Pixel 7"] }, engine: "chromium" },
  { name: "iphone13", opts: { ...devices["iPhone 13"] }, engine: "webkit" },
  { name: "320", opts: { viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true } },
  { name: "1920", opts: { viewport: { width: 1920, height: 1080 } } },
  { name: "rtl-390", opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, locale: "ar" },
];

test("surfaces: page, cards and inputs are distinct in light and dark everywhere", async ({ browser, browserName, baseURL }) => {
  test.setTimeout(1_800_000);
  await setPalette({ colorPalette: "custom", customPalette: { brand: "#1E3A8A", accent: "#0F766E" } });
  for (const view of VIEWS) {
    if (view.engine && view.engine !== browserName) continue;
    for (const scheme of ["light", "dark"] as const) {
      const ctx = await ctxFor(browser, baseURL, view.opts, scheme);
      await ctx.addCookies(admin);
      const page = await ctx.newPage();
      page.setDefaultTimeout(90_000);
      for (const pg of PAGES) {
        const loc = view.locale ?? "en";
        const path = pg.path.replace("/en", `/${loc}`);
        if (pg.name === "account" && !(await ctx.cookies()).some((c) => c.name === "cs" || c.name === "__Host-cs")) {
          await ensureCustomer();
          await page.goto(await seedMagicLink("ada@example.com", loc), { waitUntil: "domcontentloaded", timeout: 180_000 });
          await page.locator('[data-account-section="overview"]').first().waitFor({ state: "visible", timeout: 120_000 });
          await page.waitForLoadState("load");
        }
        await page.goto(path, { waitUntil: "domcontentloaded", timeout: 180_000 });
        await page.locator(pg.ready).first().waitFor({ state: "visible", timeout: 120_000 });
        if (pg.name === "custom-editor") await page.getByTestId("custom-palette-editor").scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        const s = await surfaces(page, pg.scope);
        const tag = `${pg.name} ${view.name} ${scheme}`;
        expect(new Set([s.paper, s.sheet, s.field]).size, `${tag} ${JSON.stringify(s)}`).toBe(3);
        if (s.inputBg && pg.name !== "account") expect(s.inputBg, tag).toBe(rgb(s.field));
        expect(s.overflow, `${tag} horizontal scroll`).toBeLessThanOrEqual(1);
        await page.screenshot({ path: `${SHOTS}/palette-v2-${pg.name}-${view.name}-${scheme}-${browserName}.png`, fullPage: false });
        if (["390", "1440"].includes(view.name) && scheme === "light" && browserName === "chromium") {
          await page.screenshot({ path: `${SHOTS}/palette-v2-${pg.name}-${view.name}.png`, fullPage: false });
        }
      }
      await ctx.close();
    }
  }
});

test("custom palette: server-rendered in the first HTML, applied without JavaScript", async ({ browser, baseURL, request }) => {
  test.setTimeout(300_000);
  await setPalette({ colorPalette: "custom", customPalette: { brand: "#7A2A8C", accent: "#0F766E" } });
  const html = await (await request.get("/en")).text();
  expect(html).toMatch(/<html[^>]*data-palette="custom"/);
  expect(html).toContain('<style id="custom-palette">');
  const expected = derivePalette("#7A2A8C", "#0F766E");
  for (const scheme of ["light", "dark"] as const) {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto("/en", { waitUntil: "commit", timeout: 180_000 });
    await page.locator(".riviera").first().waitFor({ state: "attached" });
    const sig = await page.locator(".riviera").first().evaluate((el) => getComputedStyle(el).getPropertyValue("--sig").trim().toUpperCase());
    // Without JS the theme script cannot run, so the light tokens apply.
    expect(sig).toBe(expected.light.sig);
    await ctx.close();
  }
});

test("custom palette API rejects anything but strict hex", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ baseURL });
  await ctx.addCookies(admin);
  const page = await ctx.newPage();
  for (const bad of ["red", "#fff", "#123456;}</style><script>alert(1)</script>", "url(javascript:x)"]) {
    const res = await page.request.post("/api/settings", { data: { customPalette: { brand: bad, accent: "#0F766E" } } });
    expect(res.status(), bad).toBe(400);
  }
  const ok = await page.request.post("/api/settings", { data: { colorPalette: "custom", customPalette: { brand: "#0B6E8A", accent: "#0559A0" } } });
  expect(ok.ok()).toBe(true);
  const html = await (await page.request.get("/en")).text();
  expect(html).not.toContain("<script>alert");
  await ctx.close();
});

test("custom editor: hex input, live preview, AA warning and auto-adjust", async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  await setPalette({ colorPalette: "custom", customPalette: { brand: "#1E3A8A", accent: "#0F766E" } });
  const ctx = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
  await ctx.addCookies(admin);
  const page = await ctx.newPage();
  page.setDefaultTimeout(90_000);
  await page.goto("/en/dashboard/settings/appearance", { waitUntil: "domcontentloaded", timeout: 180_000 });
  const editor = page.getByTestId("custom-palette-editor");
  await expect(editor).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId("custom-palette-warning")).toHaveCount(0);
  const preview = page.getByTestId("custom-palette-preview");
  const sig = () => preview.evaluate((el) => getComputedStyle(el).getPropertyValue("--sig").trim().toUpperCase());
  expect(await sig()).toBe("#1E3A8A");

  const hex = page.getByTestId("custom-brand-hex");
  await hex.fill("#FFD54F");
  await expect(page.getByTestId("custom-palette-warning")).toBeVisible();
  await page.getByTestId("custom-palette-warning").scrollIntoViewIfNeeded();
  const adjusted = derivePalette("#FFD54F", "#0F766E").light.sig;
  expect(await sig()).toBe(adjusted);
  await page.screenshot({ path: `${SHOTS}/palette-v2-custom-editor-warning-1440.png` });
  await page.getByTestId("custom-palette-warning").getByRole("button").first().click();
  await expect(hex).toHaveValue(adjusted);
  await expect(page.getByTestId("custom-palette-warning")).toHaveCount(0);

  await hex.fill("#12ZZ");
  await expect(hex).toHaveAttribute("aria-invalid", "true");
  expect(await sig()).toBe(adjusted);
  await ctx.close();
});
