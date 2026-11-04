import { expect, test, type Browser, type Page } from "@playwright/test";
import { configureE2eDatabase, seedMagicLink } from "./helpers/login-token";
import { signInAdmin } from "./helpers/sign-in";

const SHOTS = process.env.SHOTS_DIR ?? "/workspace/shots";
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40"><rect width="160" height="40" rx="6" fill="#0E7490"/><text x="80" y="27" font-family="Arial" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">ACME CABS</text></svg>`;
const LOGO = `data:image/svg+xml;base64,${Buffer.from(SVG).toString("base64")}`;
test.describe.configure({ mode: "default" });

async function setSettings(data: Record<string, unknown>, unset: Record<string, ""> = {}) {
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  await db.collection("settings").updateOne({}, { $set: data, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { upsert: true });
}
const logoCount = (page: Page) =>
  page.evaluate((src) => Array.from(document.querySelectorAll("img")).filter((i) => i.getAttribute("src") === src && i.getBoundingClientRect().width > 0 && i.naturalWidth > 0).length, LOGO).catch(() => 0);

type Surface = { name: string; path: string; login?: (page: Page) => Promise<void> };
const SURFACES: Surface[] = [
  { name: "booking-dock", path: "/en" },
  { name: "account-login", path: "/en/account" },
  { name: "account-home", path: "", login: async (page) => { await page.goto(await seedMagicLink("ada@example.com"), { timeout: 180_000 }); await page.locator("[data-account-section]").waitFor({ timeout: 180_000 }); } },
  { name: "account-rides", path: "/en/account/rides", login: async (page) => { await page.goto(await seedMagicLink("ada@example.com"), { timeout: 180_000 }); await page.locator("[data-account-section]").waitFor({ timeout: 180_000 }); } },
  { name: "admin-signin", path: "/en/dashboard/signin" },
  { name: "admin-dashboard", path: "/en/dashboard/home", login: (page) => signInAdmin(page) },
  { name: "partner-login", path: "/en/partners/login" },
  { name: "partner-dashboard", path: "", login: async (page) => { await signInAdmin(page, { path: "/en/partners/login", email: "partner@e2e.example", password: "e2e-password" }); await page.waitForURL((u) => !u.pathname.includes("login"), { timeout: 120_000 }); } },
  { name: "driver-login", path: "/en/drivers/login" },
  { name: "driver-dashboard", path: "", login: async (page) => { await signInAdmin(page, { path: "/en/drivers/login", email: "driver@e2e.example", password: "e2e-password" }); await page.waitForURL((u) => !u.pathname.includes("login"), { timeout: 120_000 }); } },
];

test.beforeAll(() => setSettings({ companyLogoUrl: LOGO, companyName: "Acme Cabs" }));
test.afterAll(() => setSettings({}, { companyLogoUrl: "" }));

async function open(browser: Browser, baseURL: string | undefined, width: number, isMobile: boolean) {
  const ctx = await browser.newContext({ baseURL, viewport: { width, height: width < 768 ? 844 : 1000 }, isMobile, hasTouch: width < 768 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(120_000);
  return { ctx, page };
}

for (const width of [390, 1440]) {
  for (const s of SURFACES) {
    test(`${s.name} ${width} shows the operator logo`, async ({ browser, baseURL, browserName }) => {
      test.setTimeout(400_000);
      const { ctx, page } = await open(browser, baseURL, width, width < 768);
      if (s.login) await s.login(page);
      if (s.path) await page.goto(s.path, { waitUntil: "domcontentloaded", timeout: 180_000 }).catch(() => page.goto(s.path, { waitUntil: "domcontentloaded", timeout: 180_000 }));
      await page.waitForLoadState("load");
      await expect.poll(() => logoCount(page), { timeout: 60_000 }).toBeGreaterThan(0);
      await page.screenshot({ path: `${SHOTS}/logo-${s.name}-${width}-${browserName}.png` });
      await ctx.close();
    });
  }
}
