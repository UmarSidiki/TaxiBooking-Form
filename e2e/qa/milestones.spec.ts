import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN, gotoPath, shot, signIn } from "./support";

const VIEWS = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, mobile: false },
  {
    name: "pixel",
    viewport: { width: 412, height: 915 },
    mobile: true,
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
  },
  {
    name: "iphone",
    viewport: { width: 390, height: 844 },
    mobile: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
  },
] as const;

async function axeOk(page: Page) {
  const result = await new AxeBuilder({ page })
    .exclude("nextjs-portal")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const bad = result.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
  expect(bad.map((item) => `${item.id}: ${item.help}`)).toEqual([]);
}

test("milestones and portals", async ({ page, browser }) => {
  test.setTimeout(240_000);
  page.setDefaultTimeout(20_000);

  await gotoPath(page, "/en/account");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await shot(page, "m9-account-desktop");
  await axeOk(page);

  await gotoPath(page, "/en/ride-status");
  await expect(page.getByRole("heading", { name: "Link expired" })).toBeVisible();
  await shot(page, "m10-status-desktop");

  await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
  for (const path of [
    "/en/dashboard/pricing",
    "/en/dashboard/settings",
    "/en/dashboard/settings/checkout",
    "/en/dashboard/settings/modules",
    "/en/dashboard/settings/whatsapp",
    "/en/dashboard/today",
    "/en/dashboard/rides",
  ]) {
    await gotoPath(page, path);
    await shot(page, `pass-${path.split("/").filter(Boolean).slice(-1)[0]}-desktop`);
    await axeOk(page);
  }

  await gotoPath(page, "/en");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Hourly" }).click();
  await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
  await page.locator('input[type="date"]').first().fill("2026-12-20");
  await page.locator('input[type="time"]').first().fill("23:00");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "Select" }).first()).toBeVisible();
  await shot(page, "hourly-vehicles-desktop");

  await page.evaluate(() => sessionStorage.clear());
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
  await page.getByPlaceholder("Enter destination address").fill("Lausanne Station");
  await page.getByRole("button", { name: "Round Trip" }).click();
  await page.locator('input[type="date"]').nth(0).fill("2026-12-15");
  await page.locator('input[type="time"]').nth(0).fill("09:30");
  await page.locator('input[type="date"]').nth(1).fill("2026-12-16");
  await page.locator('input[type="time"]').nth(1).fill("18:00");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "Select" }).first()).toBeVisible();
  await shot(page, "return-vehicles-desktop");

  await reviewAccount(browser);
});

async function reviewAccount(browser: Browser) {
  for (const view of VIEWS) {
    const context = await browser.newContext({
      viewport: view.viewport,
      isMobile: view.mobile,
      hasTouch: view.mobile,
      userAgent: "userAgent" in view ? view.userAgent : undefined,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    await gotoPath(page, "/en/account");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await shot(page, `m9-account-${view.name}`);
    await axeOk(page);
    await gotoPath(page, "/en/partners/login");
    await shot(page, `partner-login-${view.name}`);
    await axeOk(page);
    await gotoPath(page, "/en/drivers/login");
    await shot(page, `driver-login-${view.name}`);
    await axeOk(page);
    await context.close();
  }
}
