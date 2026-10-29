import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: "admin@e2e.example", password: "e2e-password" };

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/en/dashboard/signin");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("signin") && !url.pathname.includes("login"));
  await page.waitForLoadState("domcontentloaded");
}

async function openPath(page: Page, path: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (!page.url().includes(path)) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("ERR_ABORTED") || attempt === 2) throw error;
      await page.waitForTimeout(500);
    }
  }
}

test("whatsapp settings lists events, filters deliveries, and edits a template", async ({ page }, testInfo) => {
  await signIn(page, ADMIN.email, ADMIN.password);
  await openPath(page, "/en/dashboard/settings/whatsapp");

  await expect(page.getByRole("heading", { name: "WhatsApp connection" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sending rules" })).toBeVisible();

  for (const group of ["Passengers", "Desk", "Drivers", "Partners"]) {
    await expect(page.getByRole("heading", { name: group, exact: true })).toBeVisible();
  }

  const row = page.locator("#notify-row-booking_confirmed-customer");
  await expect(row).toBeVisible();
  await expect(row.getByText("Booking confirmed")).toBeVisible();

  await expect(page.getByLabel("Event")).toBeVisible();
  await expect(page.getByLabel("Status")).toBeVisible();

  await row.getByRole("button", { name: "Edit message" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Edit message" })).toBeVisible();
  await expect(dialog.getByText("Variables")).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Message" })).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("whatsapp-event-sheet.png"),
    fullPage: true,
  });

  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();

  await page.screenshot({
    path: testInfo.outputPath("whatsapp-settings.png"),
    fullPage: true,
  });
});
