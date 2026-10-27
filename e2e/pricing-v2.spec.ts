import { expect, test, type Page } from "@playwright/test";

const SHOTS = "/workspace/shots";

async function go(page: Page, path: string) {
  for (let i = 0; i < 4; i += 1) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      if (i === 3) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

async function switchOn(page: Page, name: string, on: boolean) {
  const control = page.getByRole("switch", { name });
  if ((await control.getAttribute("aria-checked")) !== String(on)) await control.click();
}

test("pricing v2 click-through", async ({ page }, info) => {
  test.setTimeout(300_000);
  const p = info.project.name;
  await go(page, "/en/dashboard/signin");
  await page.locator("#email").fill("admin@e2e.example");
  await page.locator("#password").fill("e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("signin"));

  // Extras and holidays
  await go(page, "/en/dashboard/pricing");
  await expect(page.getByRole("heading", { name: "Extras" })).toBeVisible({ timeout: 120_000 });
  await switchOn(page, "Meet & greet", true);
  await switchOn(page, "Child seat", true);
  await switchOn(page, "Baby / booster seat", false);
  const prices = page.getByLabel("Price", { exact: true });
  await prices.fill("15");
  await page.getByLabel("Price per seat").fill("7");
  const holidays = page.getByRole("heading", { name: "Holiday surcharges" });
  if (await page.getByText("No holidays added yet.").isVisible()) {
    await page.getByLabel("Start date").fill("2026-12-24");
    await page.getByLabel("End date").fill("2026-12-26");
    await page.getByLabel("Holiday percent").fill("10");
    await page.getByRole("button", { name: "Add holiday" }).click();
  }
  await page.getByLabel("Start date").fill("2026-12-25");
  await page.getByLabel("Holiday percent").fill("25");
  await expect(page.getByText(/Overlaps 2026-12-24 → 2026-12-26/)).toBeVisible();
  await holidays.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/v2-${p}-holidays.png` });
  await page.getByRole("button", { name: "Add holiday" }).click();
  await page.getByRole("heading", { name: "Extras" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/v2-${p}-pricing-extras.png` });
  const save = page.getByRole("button", { name: "Save rules" });
  if (await save.isVisible()) {
    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  }

  // Fleet form
  await go(page, "/en/dashboard/fleet");
  await page.getByRole("button", { name: /edit/i }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Capacity" }).click();
  const moved = page.getByText("Child and baby seat prices are set once for all vehicles in");
  await expect(moved).toBeVisible({ timeout: 30_000 });
  await moved.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/v2-${p}-fleet-form.png` });

  // Booking step 3
  const extras = await (await page.request.get("/api/pricing/extras")).json();
  expect(extras.extras.babySeat.enabled).toBe(false);
  await go(page, "/en");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
  await page.getByPlaceholder("Enter destination address").fill("Lausanne Station");
  await page.locator('input[type="date"]').first().fill("2026-12-25");
  await page.locator('input[type="time"]').first().fill("12:00");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Select" }).first().click();
  await expect(page.getByRole("checkbox", { name: /Meet & greet/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("+€15.00").or(page.getByText(/\+.?15\.00/)).first()).toBeVisible();
  await expect(page.getByText("Baby seats", { exact: false })).toHaveCount(0);
  await page.getByRole("checkbox", { name: /Meet & greet/ }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/v2-${p}-step3.png` });
});
