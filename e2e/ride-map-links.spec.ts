import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const SHOTS = "/workspace/shots";
const SEARCH = "https://www.google.com/maps/search/?api=1&query=";
const DIRECTIONS = "https://www.google.com/maps/dir/?api=1&destination=";
const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
] as const;

async function signIn(page: Page, path: string, email: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 180_000 });
  // Filling before React hydrates leaves the controlled inputs empty (WebKit hits this).
  await page.locator("form[data-ready=true]").waitFor({ state: "visible", timeout: 120_000 });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("e2e-password");
    if ((await page.locator("#email").inputValue()) === email) break;
  }
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("login"), { timeout: 120_000, waitUntil: "commit" });
}

async function openPath(page: Page, path: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (!page.url().includes(path)) await page.goto(path, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("ERR_ABORTED") || attempt === 2) throw error;
      await page.waitForTimeout(500);
    }
  }
}

function shot(page: Page, name: string, browser: string) {
  mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: `${SHOTS}/maplinks-${name}-${browser}.png`, fullPage: true });
}

for (const viewport of VIEWPORTS) {
  test(`driver dashboard shows coordinates and map links (${viewport.name})`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await signIn(page, "/en/drivers/login", "driver@e2e.example");
    await openPath(page, "/en/drivers/dashboard");

    const list = page.getByTestId("ride-locations").first();
    await expect(list).toBeVisible({ timeout: 60_000 });
    const pickup = list.getByTestId("ride-location-pickup");
    await expect(pickup).toContainText("Lugano Station");
    await expect(pickup.getByTestId("ride-location-coords")).toHaveText("46.005462, 8.946987");
    await expect(pickup.getByRole("link", { name: /Open in Maps/ })).toHaveAttribute("href", `${SEARCH}46.005462%2C8.946987`);
    await expect(pickup.getByRole("link", { name: /Navigate/ })).toHaveAttribute("href", `${DIRECTIONS}46.005462%2C8.946987`);
    await expect(list.getByTestId("ride-location-stop")).toContainText("Piazza della Riforma");
    await expect(list.getByTestId("ride-location-dropoff").getByTestId("ride-location-coords")).toHaveText("45.988300, 8.946100");
    await expect(page.getByRole("link", { name: "Open navigation", exact: true }).first()).toHaveAttribute("href", `${DIRECTIONS}46.005462%2C8.946987`);
    await shot(page, `driver-${viewport.name}`, testInfo.project.name);

    await page.getByRole("button", { name: "View Details" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByTestId("ride-locations")).toBeVisible();
    await expect(dialog.getByTestId("ride-location-stop").getByTestId("ride-location-coords")).toHaveText("46.003700, 8.951100");
    await shot(page, `driver-detail-${viewport.name}`, testInfo.project.name);
  });

  test(`partner rides show coordinates and fall back to address links (${viewport.name})`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await signIn(page, "/en/partners/login", "partner@e2e.example");
    await openPath(page, "/en/partners/rides");

    const card = page.getByTestId("ride-locations").filter({ hasText: "Geneva Airport" }).first();
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card.getByTestId("ride-location-pickup").getByTestId("ride-location-coords")).toHaveText("46.238065, 6.108956");
    await expect(card.getByTestId("ride-location-pickup").getByRole("link", { name: /Open in Maps/ })).toHaveAttribute("href", `${SEARCH}46.238065%2C6.108956`);
    const dropoff = card.getByTestId("ride-location-dropoff");
    await expect(dropoff).toContainText("Lausanne Station");
    await expect(dropoff.getByTestId("ride-location-coords")).toHaveCount(0);
    await expect(dropoff.getByRole("link", { name: /Open in Maps/ })).toHaveAttribute("href", `${SEARCH}Lausanne%20Station`);
    await shot(page, `partner-${viewport.name}`, testInfo.project.name);
  });
}

test("rendered driver email shows map links", async ({ page }, testInfo) => {
  const file = `${SHOTS}/maplinks-email.html`;
  test.skip(!existsSync(file), "render the email HTML first");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(readFileSync(file, "utf8"));
  await expect(page.getByText("Map links")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in Maps" }).first()).toHaveAttribute("href", `${SEARCH}46.238065%2C6.108956`);
  await shot(page, "email-390", testInfo.project.name);
  await page.setViewportSize({ width: 1440, height: 900 });
  await shot(page, "email-1440", testInfo.project.name);
});
