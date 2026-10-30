import { expect, test } from "@playwright/test";

test("appearance preview follows the accent colour and refuses one too light", async ({ page }) => {
  test.setTimeout(300_000);
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/en/dashboard/signin", { timeout: 180_000 });
  await page.locator("#email").fill("admin@e2e.example");
  await page.locator("#password").fill("e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("signin"), { timeout: 120_000 });
  await page.waitForLoadState("networkidle");
  await page.goto("/en/dashboard/settings/appearance", { timeout: 180_000 });
  const preview = page.locator(".appearance-preview");
  await expect(preview).toBeVisible({ timeout: 120_000 });
  const box = await preview.boundingBox();
  expect(box?.height ?? 0).toBeLessThan(400);

  const field = page.locator("#appearance-primary-color-text");
  const button = page.locator(".appearance-preview__go");
  await field.fill("#1F4E79");
  await expect(button).toHaveCSS("background-color", "rgb(31, 78, 121)");

  await field.fill("#F5C542");
  await expect(page.getByText("too light for white button text")).toBeVisible();
  await expect(button).not.toHaveCSS("background-color", "rgb(245, 197, 66)");
});
