import { expect, test, type Page } from "@playwright/test";
import { configureE2eDatabase } from "./helpers/login-token";

const SHOTS = process.env.SHOTS_DIR ?? "/workspace/shots";
const LEGACY = "rgb(0, 255, 0)";
const PAGES = [
  ["booking", "/en"],
  ["signin", "/en/account"],
  ["admin-signin", "/en/dashboard/signin"],
  ["partner-signup", "/en/partners/register"],
  ["driver-signup", "/en/drivers/register"],
] as const;
test.describe.configure({ mode: "serial" });

async function setSettings(data: Record<string, unknown>) {
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  await db.collection("settings").updateOne({}, { $set: data }, { upsert: true });
}
const legacyUses = (page: Page) =>
  page.evaluate((legacy) => {
    const hits: string[] = [];
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const s = getComputedStyle(el);
      if ([s.backgroundColor, s.color, s.borderTopColor, s.fill, s.stroke].includes(legacy)) hits.push(el.tagName);
    }
    return hits;
  }, LEGACY);

test.beforeAll(() => setSettings({ colorPalette: "heritage", primaryColor: "#00FF00", secondaryColor: "#00FF00" }));
test.afterAll(() => setSettings({ colorPalette: "neutral", primaryColor: "#B45309", secondaryColor: "#111827" }));

for (const width of [390, 1440]) {
  for (const scheme of ["light", "dark"] as const) {
    for (const [name, path] of PAGES) {
      test(`${name} ${width} ${scheme} uses the palette, not the legacy colour`, async ({ browser, browserName, baseURL }) => {
        const ctx = await browser.newContext({ baseURL, viewport: { width, height: width < 768 ? 844 : 1000 }, colorScheme: scheme, isMobile: width < 768 && browserName !== "firefox", hasTouch: width < 768 });
        await ctx.addInitScript((s) => localStorage.setItem("riviera-theme", s), scheme);
        const page = await ctx.newPage();
        await page.goto(path, { waitUntil: "domcontentloaded", timeout: 180_000 });
        await page.locator(".riviera, form").first().waitFor({ timeout: 180_000 });
        await page.waitForTimeout(1500);
        const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--primary-color").trim().toUpperCase());
        expect(primary).toBe(scheme === "light" ? "#8E1B2B" : "#E0737F");
        expect(await legacyUses(page)).toEqual([]);
        await page.screenshot({ path: `${SHOTS}/colors-${name}-${width}-${scheme}-${browserName}.png` });
        await ctx.close();
      });
    }
  }
  test(`emails ${width} render with the palette accent`, async ({ browser, browserName }) => {
    const { readFileSync } = await import("node:fs");
    for (const file of ["booking-confirmed", "otp"]) {
      const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await ctx.newPage();
      await page.setContent(readFileSync(`/tmp/colors-emails/${file}.html`, "utf8"));
      expect(await legacyUses(page)).toEqual([]);
      await page.screenshot({ path: `${SHOTS}/colors-email-${file}-${width}-${browserName}.png`, fullPage: true });
      await ctx.close();
    }
  });
}
