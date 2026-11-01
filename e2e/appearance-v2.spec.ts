import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";
import { configureE2eDatabase } from "./helpers/login-token";

type Cookies = Parameters<BrowserContext["addCookies"]>[0];
const SHOTS = process.env.SHOTS_DIR ?? "/workspace/shots";
const PATH = "/en/dashboard/settings/appearance";
let admin: Cookies = [];
test.describe.configure({ mode: "serial" });

async function setSettings(data: Record<string, unknown>, unset: Record<string, ""> = {}) {
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  await db.collection("settings").updateOne({}, { $set: data, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { upsert: true });
}
async function readSettings() {
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  return db.collection("settings").findOne({});
}

async function open(browser: Browser, baseURL: string | undefined, width: number, scheme: "light" | "dark") {
  const ctx = await browser.newContext({ baseURL, viewport: { width, height: width < 768 ? 844 : 1000 }, colorScheme: scheme, reducedMotion: "reduce", isMobile: width < 768, hasTouch: width < 768 });
  await ctx.addInitScript((s) => localStorage.setItem("riviera-theme", s), scheme);
  await ctx.addCookies(admin);
  const page = await ctx.newPage();
  page.setDefaultTimeout(90_000);
  await page.goto(PATH, { waitUntil: "domcontentloaded", timeout: 180_000 });
  await expect(page.locator(".riviera").first()).toBeVisible({ timeout: 120_000 });
  return { ctx, page };
}
const rootVar = (page: Page, k: string) => page.evaluate((key) => getComputedStyle(document.querySelector(".riviera")!).getPropertyValue(key).trim().toUpperCase(), k);
const scopeVar = (page: Page, id: string, k: string) =>
  page.getByTestId(id).evaluate((el, key) => getComputedStyle(el).getPropertyValue(key).trim().toUpperCase(), k);

test.beforeAll(async ({ browser, baseURL }) => {
  const c = await browser.newContext({ baseURL });
  const p = await c.newPage();
  p.setDefaultTimeout(120_000);
  await signInAdmin(p);
  admin = await c.cookies();
  await c.close();
});
test.afterAll(async () => setSettings({ colorPalette: "neutral", primaryColor: "#B45309" }, { customPalette: "" }));

test("no standalone primary/secondary fields; a legacy primary colour can be folded into Custom", async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  await setSettings({ colorPalette: "neutral", primaryColor: "#7C2D12" }, { customPalette: "" });
  const { ctx, page } = await open(browser, baseURL, 1440, "light");
  await expect(page.locator("#appearance-primary-color-text, #appearance-secondary-color-text")).toHaveCount(0);
  // Existing operators look the same: the legacy colour still drives buttons until they act.
  expect(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--operator-accent").trim().toUpperCase())).toBe("#7C2D12");
  const notice = page.getByTestId("legacy-accent");
  await expect(notice).toContainText("#7C2D12");
  await page.getByTestId("legacy-accent-move").click();
  await expect(page.getByTestId("custom-palette-editor")).toBeVisible();
  await expect(page.getByTestId("custom-brand-hex")).toHaveValue("#7C2D12");
  await expect(notice).toHaveCount(0);
  await ctx.close();
});

test("custom editor pins background, cards and text; saved values apply on reload in light and dark", async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  await setSettings({ colorPalette: "custom", customPalette: { brand: "#1E3A8A", accent: "#0F766E" }, primaryColor: "#B45309" });
  const { ctx, page } = await open(browser, baseURL, 1440, "light");
  await expect(page.getByTestId("custom-palette-editor")).toBeVisible();
  await expect(page.getByTestId("custom-paper-reset")).toHaveCount(0);

  await page.getByTestId("custom-paper-hex").fill("#F3EEE2");
  await page.getByTestId("custom-sheet-hex").fill("#FFFCF5");
  await page.getByTestId("custom-ink-hex").fill("#1A1A1A");
  await expect(page.getByTestId("custom-paper-reset")).toBeVisible();
  expect(await scopeVar(page, "custom-palette-preview-light", "--paper")).toBe("#F3EEE2");
  expect(await scopeVar(page, "custom-palette-preview-light", "--sheet")).toBe("#FFFCF5");

  // Low contrast text warns, invalid hex is refused.
  await page.getByTestId("custom-ink2-hex").fill("#DDDDDD");
  await expect(page.getByTestId("custom-text-warning")).toBeVisible();
  await page.getByTestId("custom-ink2-reset").click();
  await expect(page.getByTestId("custom-text-warning")).toHaveCount(0);
  await page.getByTestId("custom-field-hex").fill("#12ZZ");
  await expect(page.getByTestId("custom-field-hex")).toHaveAttribute("aria-invalid", "true");
  await page.getByTestId("custom-field-reset").count().then((n) => expect(n).toBe(0));

  await page.getByTestId("custom-mode-dark").click();
  await page.getByTestId("custom-paper-hex").fill("#0B1220");
  await page.getByTestId("custom-sheet-hex").fill("#131C2E");
  expect(await scopeVar(page, "custom-palette-preview-dark", "--paper")).toBe("#0B1220");

  await page.getByRole("button", { name: "Save" }).first().click();
  await expect.poll(async () => (await readSettings())?.customPalette?.dark?.paper, { timeout: 30_000 }).toBe("#0B1220");
  const saved = (await readSettings())?.customPalette;
  expect(saved.light).toEqual({ paper: "#F3EEE2", sheet: "#FFFCF5", ink: "#1A1A1A" });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("custom-palette-editor")).toBeVisible({ timeout: 120_000 });
  expect(await rootVar(page, "--paper")).toBe("#F3EEE2");
  expect(await rootVar(page, "--sheet")).toBe("#FFFCF5");
  expect(await rootVar(page, "--ink")).toBe("#1A1A1A");
  await ctx.close();

  const dark = await open(browser, baseURL, 1440, "dark");
  await expect(dark.page.getByTestId("custom-palette-editor")).toBeVisible({ timeout: 120_000 });
  expect(await rootVar(dark.page, "--paper")).toBe("#0B1220");
  expect(await rootVar(dark.page, "--sheet")).toBe("#131C2E");
  await dark.ctx.close();

  // Public booking form gets the same pinned colours on first paint.
  const html = await (await fetch(`${baseURL}/en`)).text();
  expect(html).toContain("--paper: #F3EEE2;");
  expect(html).toContain("--paper: #0B1220;");
});

for (const width of [390, 1440]) {
  for (const scheme of ["light", "dark"] as const) {
    test(`appearance v2 screenshot ${width} ${scheme}`, async ({ browser, baseURL, browserName }) => {
      test.skip(browserName !== "chromium", "screenshots once");
      test.setTimeout(300_000);
      const { ctx, page } = await open(browser, baseURL, width, scheme);
      await expect(page.getByTestId("custom-palette-editor")).toBeVisible({ timeout: 120_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await page.getByTestId("custom-surfaces").scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${SHOTS}/appearance-v2-${width}-${scheme}.png` });
      await page.screenshot({ path: `${SHOTS}/appearance-v2-${width}-${scheme}-full.png`, fullPage: true });
      await ctx.close();
    });
  }
}
