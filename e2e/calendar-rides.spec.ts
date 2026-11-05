import { expect, test, type Page } from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";

async function openCalendar(page: Page) {
  await signInAdmin(page);
  await page.waitForLoadState("domcontentloaded");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await page.goto("/en/dashboard/calendar", {
        waitUntil: "domcontentloaded",
        timeout: 180_000,
      });
      break;
    } catch (error) {
      if (attempt === 3) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

test("calendar booking opens the ride dialog", async ({ page }) => {
  await openCalendar(page);
  const booking = page
    .locator('[role="grid"] button[aria-label*="Today Square"]')
    .first();
  await expect(booking).toBeVisible({ timeout: 30_000 });
  await booking.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: /Today Square/ })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Open ride" })).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).first().click();
  await expect(dialog).not.toBeVisible();
});

test("calendar booking opens from the mobile agenda", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await openCalendar(page);
  const booking = page
    .locator('button[aria-label*="Today Square"]:visible')
    .first();
  await expect(booking).toBeVisible({ timeout: 30_000 });
  await booking.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: /Today Square/ })).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).first().click();
  await ctx.close();
});
