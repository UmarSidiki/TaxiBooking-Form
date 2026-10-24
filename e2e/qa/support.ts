import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { expect, type Browser, type Page } from "@playwright/test";

export const ARTIFACTS = "/opt/cursor/artifacts/qa";
export const TMP = "/tmp/qa-shots";
export const ADMIN = { email: "admin@qa.example", password: "qa-password" };
export const ALPINE = { email: "partner.one@qa.example", password: "qa-password" };
export const LAKE = { email: "partner.two@qa.example", password: "qa-password" };
export const NIA = { email: "driver.one@qa.example", password: "qa-password" };

export type StepResult = { id: string; pass: boolean; error?: string };

export async function shot(page: Page, name: string) {
  mkdirSync(TMP, { recursive: true });
  mkdirSync(ARTIFACTS, { recursive: true });
  const file = `${TMP}/${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  try {
    copyFileSync(file, `${ARTIFACTS}/${name}.png`);
  } catch {
    // Artifact disk can reject writes; the /tmp copy remains.
  }
}

export async function gotoPath(page: Page, path: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("ERR_ABORTED") || attempt === 2) throw error;
      await page.waitForTimeout(400);
    }
  }
}

export async function openFresh(page: Page, path: string) {
  await gotoPath(page, path);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
}

export async function signIn(page: Page, path: string, email: string, password: string) {
  await page.context().clearCookies();
  await gotoPath(page, path);
  await page.locator("form[data-ready=true]").waitFor();
  const emailField = page.locator("#email");
  const passwordField = page.locator("#password");
  await emailField.fill(email);
  await passwordField.fill(password);
  await expect(emailField).toHaveValue(email);
  await expect(passwordField).toHaveValue(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("signin") && !url.pathname.includes("login"));
  await page.waitForLoadState("domcontentloaded");
}

export async function step(page: Page, results: StepResult[], id: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ id, pass: true });
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    results.push({ id, pass: false, error: message });
    await shot(page, `fail-${id}`).catch(() => undefined);
  }
}

export function writeReport(results: StepResult[]) {
  const body = JSON.stringify(results, null, 2);
  writeFileSync("/tmp/qa-report.json", body);
  try {
    mkdirSync(ARTIFACTS, { recursive: true });
    writeFileSync(`${ARTIFACTS}/report.json`, body);
  } catch {
    // Keep the /tmp report.
  }
}

export function layoutId() {
  const seed = JSON.parse(readFileSync("/tmp/qa-seed.json", "utf8")) as { layoutId: string };
  return seed.layoutId;
}

export async function portalShots(browser: Browser, results: StepResult[]) {
  const views = [
    { name: "pixel", viewport: { width: 412, height: 915 }, userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36" },
    { name: "iphone", viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1" },
  ];
  for (const view of views) {
    const context = await browser.newContext({
      viewport: view.viewport,
      userAgent: view.userAgent,
      isMobile: true,
      hasTouch: true,
      timezoneId: "UTC",
    });
    const page = await context.newPage();
    await step(page, results, `portal-admin-${view.name}`, async () => {
      await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
      await gotoPath(page, "/en/dashboard/today");
      await expect(page.getByText("Unassigned today")).toBeVisible();
      await shot(page, `admin-today-${view.name}`);
      await gotoPath(page, "/en/dashboard/rides");
      const upcoming = page.getByRole("tab", { name: "Upcoming" });
      if (await upcoming.count()) await upcoming.click();
      await shot(page, `admin-rides-${view.name}`);
      await gotoPath(page, "/en/dashboard/calendar");
      await expect(page.getByRole("list", { name: "Agenda" })).toBeVisible();
      await shot(page, `admin-calendar-${view.name}`);
    });
    await step(page, results, `portal-partner-${view.name}`, async () => {
      await signIn(page, "/en/partners/login", ALPINE.email, ALPINE.password);
      await gotoPath(page, "/en/partners/dashboard");
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
      await shot(page, `partner-dashboard-${view.name}`);
      await gotoPath(page, "/en/partners/billing");
      await shot(page, `partner-billing-${view.name}`);
      await gotoPath(page, "/en/partners/calendar");
      await shot(page, `partner-calendar-${view.name}`);
    });
    await step(page, results, `portal-driver-${view.name}`, async () => {
      await signIn(page, "/en/drivers/login", NIA.email, NIA.password);
      await gotoPath(page, "/en/drivers/dashboard");
      await expect(page.getByRole("heading", { name: "Time off" })).toBeVisible();
      await shot(page, `driver-rides-${view.name}`);
      await gotoPath(page, "/en/drivers/calendar");
      await shot(page, `driver-calendar-${view.name}`);
    });
    await context.close();
  }
}

export function card(page: Page, trip: string) {
  return page.locator("article").filter({ has: page.getByRole("heading", { name: `Trip #${trip}` }) });
}
