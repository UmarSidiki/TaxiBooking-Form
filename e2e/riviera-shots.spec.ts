import { expect, test } from "@playwright/test";

const SHOTS = "/workspace/shots";

for (const scheme of ["light", "dark"] as const) {
  test(`riviera form screenshots (${scheme})`, async ({ page }, info) => {
    test.setTimeout(300_000);
    await page.emulateMedia({ colorScheme: scheme });
    const view = info.project.name === "desktop" ? "desktop" : "iphone";
    const name = `${view}-${scheme}`;
    await page.goto("/en", { waitUntil: "domcontentloaded", timeout: 180_000 });
    await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${SHOTS}/app-${name}-step1.png` });
    await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
    await page.getByPlaceholder("Enter destination address").fill("Lausanne Station");
    await page.locator('input[type="date"]').first().fill("2026-12-25");
    await page.locator('input[type="time"]').first().fill("12:00");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SHOTS}/app-${name}-step2.png` });
    await page.getByRole("button", { name: "Select" }).first().click();
    await expect(page.getByLabel("Promo code")).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: `${SHOTS}/app-${name}-step3.png` });
    if (scheme === "light" && view === "iphone") {
      await page.goto("/ar", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${SHOTS}/app-iphone-ar-step1.png` });
    }
  });
}
