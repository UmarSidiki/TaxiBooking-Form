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

async function consentFor(email: string) {
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  return db.collection("marketingconsents").find({ emailLower: email }).toArray();
}

async function bookCash(page: Page, email: string) {
  const vehicles = (await (await page.request.get("/api/vehicles")).json()) as {
    data?: { _id: string }[];
  };
  const vehicle = vehicles.data?.[0]?._id;
  expect(vehicle).toBeTruthy();
  const res = await page.request.post("/api/booking", {
    headers: { "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 20}` },
    data: {
      firstName: "Auto",
      lastName: "Optin",
      email,
      phone: "+14155552671",
      passengers: 1,
      companyWebsite: "",
      formStartedAt: Date.now() - 10_000,
      paymentMethod: "cash",
      selectedVehicle: vehicle,
      bookingType: "destination",
      tripType: "oneway",
      pickup: "Geneva Airport",
      dropoff: "Lausanne Station",
      date: "2030-03-10",
      time: "10:00",
      locale: "en",
    },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as { tripId: string };
}

test("step 3 has no offers section; a booking auto-records consent only while Marketing is on", async ({ page }) => {
  test.setTimeout(300_000);
  await seed();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  await expect(page.getByPlaceholder("Enter pickup address")).toBeVisible({ timeout: 120_000 });
  await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
  await page.getByPlaceholder("Enter destination address").fill("Lausanne Station");
  await page.locator('input[type="date"]').first().fill("2030-03-10");
  await page.locator('input[type="time"]').first().fill("12:00");
  await page.locator('input[type="time"]').first().blur();
  await page.keyboard.press("Escape");
  const next = page.getByRole("button", { name: "Continue", exact: true });
  await expect(next).toBeEnabled({ timeout: 90_000 });
  await next.click();
  await page.getByRole("button", { name: "Select", exact: true }).first().click();
  await expect(page.getByLabel("Promo code")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText("Ride offers (optional)")).toHaveCount(0);
  await expect(page.getByText(/Email me offers/)).toHaveCount(0);
  mkdirSync(SHOTS, { recursive: true });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${SHOTS}/step3-no-offers-${test.info().project.name}-${width}.png`,
      fullPage: true,
    });
  }

  const on = `auto.on.${test.info().project.name}@example.com`;
  await bookCash(page, on);
  await expect
    .poll(async () => (await consentFor(on)).map((e) => `${e.channel}:${e.source}`).sort())
    .toEqual(["email:checkout_auto", "whatsapp:checkout_auto"]);

  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  const db = (await connectDB()).connection.db!;
  await db.collection("settings").updateOne({}, { $set: { enableMarketing: false } });
  const off = `auto.off.${test.info().project.name}@example.com`;
  await bookCash(page, off);
  await page.waitForTimeout(1_000);
  expect(await consentFor(off)).toHaveLength(0);
  await db.collection("settings").updateOne({}, { $unset: { enableMarketing: "" } });
});

const QA_KEY = process.env.CRON_SECRET ?? "e2e-cron-secret";

async function signInCode(page: Page, email: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const res = await page.request.get("/api/qa/outbox", { headers: { "x-qa-key": QA_KEY } });
    const body = (await res.json()) as { mail: { to?: string | string[]; text?: string }[] };
    const mine = body.mail.filter((m) => (Array.isArray(m.to) ? m.to : [m.to]).includes(email));
    const code = (mine.at(-1)?.text ?? "").match(/\b\d{6}\b/)?.[0];
    if (code) return code;
    await page.waitForTimeout(250);
  }
  throw new Error(`No sign-in code for ${email}`);
}

test("a brand-new customer books, signs in by email code, sees the ride, and shows up for the admin", async ({ page, browser }) => {
  test.setTimeout(300_000);
  await seed();
  const email = `new.${test.info().project.name}.${Date.now()}@example.com`;
  const { tripId } = await bookCash(page, email);
  expect(tripId).toBeTruthy();

  const customer = await browser.newContext({
    baseURL: "http://127.0.0.1:3000",
    extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 20}` },
  });
  const cpage = await customer.newPage();
  await cpage.goto("/en/account", { waitUntil: "domcontentloaded" });
  // Type only after hydration: WebKit can fill the input before React owns it.
  await cpage.waitForLoadState("networkidle");
  await expect(async () => {
    await cpage.locator("#account-email").fill(email);
    await expect(cpage.locator("#account-email")).toHaveValue(email);
  }).toPass();
  const sent = cpage.waitForResponse((r) => r.url().endsWith("/api/account/otp"));
  await cpage.getByRole("button", { name: "Send code" }).click();
  const sendRes = await sent;
  expect(sendRes.status(), await sendRes.text()).toBe(200);
  await expect(cpage.locator("#account-code")).toBeVisible({ timeout: 60_000 });
  const code = await signInCode(cpage, email);
  await cpage.locator("#account-code").pressSequentially(code);
  await cpage.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(cpage.locator('[data-account-section="overview"]').first()).toBeVisible({ timeout: 60_000 });
  await cpage.goto("/en/account/rides", { waitUntil: "domcontentloaded" });
  await expect(cpage.locator('[data-account-section="rides"]').first()).toBeVisible({ timeout: 60_000 });
  await expect(cpage.getByText("Geneva Airport").first()).toBeVisible({ timeout: 60_000 });
  await customer.close();

  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await page.goto("/en/dashboard/customers", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(email).first()).toBeVisible({ timeout: 90_000 });
});
