import { expect, test, type Page } from "@playwright/test";

// Screenshots of the neutral booking form and dashboard for design review.
const SHOTS = "/workspace/shots";

async function fresh(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 180_000 });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
}

for (const scheme of ["light", "dark"] as const) {
  test(`neutral booking form (${scheme})`, async ({ page }, info) => {
    test.skip(info.project.name === "pixel", "desktop and iPhone cover it");
    test.setTimeout(300_000);
    await page.emulateMedia({ colorScheme: scheme });
    const view = info.project.name === "desktop" ? "desktop" : "mobile";
    const name = `neutral-${view}-${scheme}`;
    await fresh(page, "/en");
    await page.screenshot({ path: `${SHOTS}/${name}-step1.png` });
    if (view === "mobile") await page.screenshot({ path: `${SHOTS}/${name}-step1-full.png`, fullPage: true });
    await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
    await page.getByPlaceholder("Enter destination address").fill("Lausanne Station");
    await page.locator('input[type="date"]').first().fill("2026-12-25");
    await page.locator('input[type="time"]').first().fill("12:00");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SHOTS}/${name}-step2.png`, fullPage: true });
    await page.getByRole("button", { name: "Select" }).first().click();
    await expect(page.getByLabel("Promo code")).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: `${SHOTS}/${name}-step3.png`, fullPage: true });
    if (scheme === "light") {
      await fresh(page, "/ar");
      await page.screenshot({ path: `${SHOTS}/neutral-${view}-ar-step1.png` });
    }
  });

  test(`neutral dashboard home (${scheme})`, async ({ page }, info) => {
    test.skip(info.project.name === "pixel", "desktop and iPhone cover it");
    test.setTimeout(300_000);
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/en/dashboard/signin");
    await page.locator("#email").fill("admin@e2e.example");
    await page.locator("#password").fill("e2e-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => !url.pathname.includes("signin"));
    await page.waitForTimeout(4000);
    const view = info.project.name === "desktop" ? "desktop" : "mobile";
    await page.screenshot({ path: `${SHOTS}/neutral-${view}-${scheme}-dashboard.png` });
  });
}
