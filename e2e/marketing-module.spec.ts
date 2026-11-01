import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

import { configureE2eDatabase, seedMagicLink } from "./helpers/login-token";
import { CUSTOMER, SHOTS, seed, signIn } from "./helpers/marketing-ui";

/**
 * Settings > Modules > Marketing: off hides the sidebar group and settings tab,
 * redirects marketing pages home, 403s campaign APIs and hides the customer opt-in;
 * on brings all of it back. Consent data is never touched.
 */

async function setMarketing(page: Page, on: boolean) {
  await page.goto("/en/dashboard/settings/modules", { waitUntil: "domcontentloaded" });
  const toggle = page.locator("#enableMarketing");
  await expect(toggle).toBeVisible({ timeout: 90_000 });
  if ((await toggle.getAttribute("aria-checked")) !== String(on)) await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", String(on));
  const saved = page.waitForResponse(
    (r) => r.url().includes("/api/") && r.request().method() !== "GET" && r.ok(),
  );
  await page.getByRole("button", { name: /^Save/ }).first().click();
  await saved;
}

async function marketingGroup(page: Page) {
  await page.goto("/en/dashboard/home", { waitUntil: "domcontentloaded" });
  await page.locator('[data-nav-group="overview"]:visible').first().waitFor({ timeout: 90_000 });
  return page.locator('[data-nav-group="marketing"]');
}

async function capture(page: Page, name: string) {
  mkdirSync(SHOTS, { recursive: true });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.waitForTimeout(400);
    if (width < 768 && name === "sidebar-off") {
      const trigger = page.locator('[data-sidebar="trigger"]:visible').first();
      await trigger.click();
      await page.locator('[data-slot="sidebar"][data-mobile="true"]').waitFor();
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path: `${SHOTS}/marketing-module-${name}-${test.info().project.name}-${width}.png`,
      fullPage: name !== "sidebar-off",
    });
    if (width < 768 && name === "sidebar-off") await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

test.afterAll(async () => {
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  await db.collection("settings").updateOne({}, { $unset: { enableMarketing: "" } });
});

test("Marketing module off hides and blocks marketing; on restores it", async ({ page, browser }) => {
  test.setTimeout(300_000);
  await seed();
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);

  // Default (field missing) is on.
  await expect(await marketingGroup(page)).toHaveCount(1);

  await setMarketing(page, false);
  await capture(page, "modules-off");

  const group = await marketingGroup(page);
  await expect(group).toHaveCount(0);
  await capture(page, "sidebar-off");

  for (const path of ["/en/dashboard/marketing", "/en/dashboard/marketing/campaigns", "/en/dashboard/settings/marketing"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page, path).toHaveURL(/\/en\/dashboard\/home$/, { timeout: 60_000 });
  }
  await page.goto("/en/dashboard/settings/modules", { waitUntil: "domcontentloaded" });
  await expect(page.locator('a[href$="/dashboard/settings/marketing"]')).toHaveCount(0);

  for (const url of ["/api/admin/marketing/campaigns", "/api/admin/marketing/segments", "/api/admin/marketing/templates"]) {
    const res = await page.request.get(url);
    expect(res.status(), url).toBe(403);
    expect((await res.json()).error).toBe("module_disabled");
  }

  // Customer side: ride updates stay, marketing opt-in is gone, consent is kept.
  const customer = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  const cpage = await customer.newPage();
  await cpage.goto(await seedMagicLink(CUSTOMER), { waitUntil: "domcontentloaded" });
  await expect(cpage).toHaveURL(/\/en\/account$/, { timeout: 90_000 });
  await cpage.goto("/en/account/notifications", { waitUntil: "domcontentloaded" });
  await expect(cpage.locator("#ride-updates")).toBeVisible({ timeout: 60_000 });
  await expect(cpage.locator("#offers")).toHaveCount(0);
  await expect(cpage.getByRole("switch", { name: "Email offers and news" })).toHaveCount(0);
  const optIn = await cpage.request.patch("/api/account/profile", {
    data: { marketingWhatsappOptIn: true },
  });
  expect(optIn.status()).toBe(403);
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  const profile = await db.collection("customerprofiles").findOne({ email: CUSTOMER });
  expect(profile?.marketing?.email?.status).toBe("granted");

  // Back on: everything returns.
  await setMarketing(page, true);
  await expect(await marketingGroup(page)).toHaveCount(1);
  await page.goto("/en/dashboard/marketing/campaigns", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/en\/dashboard\/marketing\/campaigns$/);
  expect((await page.request.get("/api/admin/marketing/campaigns")).status()).toBe(200);
  await cpage.goto("/en/account/notifications", { waitUntil: "domcontentloaded" });
  await expect(cpage.getByRole("switch", { name: "Email offers and news" })).toHaveAttribute(
    "aria-checked",
    "true",
    { timeout: 60_000 },
  );
  await customer.close();
});
