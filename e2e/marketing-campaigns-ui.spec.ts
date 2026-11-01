import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

import { signInAdmin } from "./helpers/sign-in";
import { configureE2eDatabase } from "./helpers/login-token";

const SHOTS = "/workspace/shots";
const CUSTOMER = "ada.ui@example.com";

async function seed() {
  configureE2eDatabase();
  process.env.NEXTAUTH_SECRET = "e2e-secret-not-for-production";
  const { connectDB } = await import("../src/shared/db");
  const mongoose = await connectDB();
  const db = mongoose.connection.db!;
  await db.collection("campaigns").deleteMany({});
  await db.collection("campaignrecipients").deleteMany({});
  await db.collection("segments").deleteMany({});
  await db.collection("campaigntemplates").deleteMany({});
  const now = new Date();
  await db.collection("customerstats").updateOne(
    { emailLower: CUSTOMER },
    {
      $set: {
        emailLower: CUSTOMER,
        name: "Ada UI",
        nameLower: "ada ui",
        phoneDigits: "41000000222",
        rideCount: 2,
        completedCount: 2,
        totalSpendMinor: 12000,
        currency: "EUR",
        firstRideAt: now,
        lastRideAt: now,
        hasUpcoming: false,
        locale: "en",
        emailConsent: "granted",
        whatsappConsent: "none",
        rebuiltAt: now,
      },
    },
    { upsert: true },
  );
  await db.collection("customerprofiles").updateOne(
    { email: CUSTOMER },
    {
      $set: {
        email: CUSTOMER,
        name: "Ada UI",
        marketing: {
          email: { status: "granted", at: now, source: "account" },
          whatsapp: { status: "none", at: null, source: "" },
        },
        language: "en",
      },
    },
    { upsert: true },
  );
  await db.collection("settings").updateOne(
    {},
    {
      $set: {
        companyName: "Lakeside Chauffeurs",
        timezone: "UTC",
        publicBaseUrl: "http://127.0.0.1:3000",
        marketingSenderName: "Offers",
        marketingSenderEmail: "offers@example.com",
        smtpFrom: "bookings@example.com",
        marketingTestRecipients: ["admin@e2e.example"],
      },
    },
    { upsert: true },
  );
}

async function signIn(page: Page) {
  await signInAdmin(page);
  await page.waitForURL(/\/dashboard\/(home|today)/, { timeout: 120_000 }).catch(() => undefined);
  await page.waitForLoadState("networkidle").catch(() => undefined);
}

async function api(page: Page, method: string, url: string, data?: unknown) {
  const res = await page.request.fetch(url, {
    method,
    data,
    headers: { "Content-Type": "application/json" },
  });
  expect(res.ok(), `${method} ${url} -> ${res.status()}`).toBeTruthy();
  return res.json();
}

async function seedDeskContent(page: Page) {
  await api(page, "POST", "/api/admin/marketing/segments", {
    name: "Loyal riders",
    filter: {},
  });
  await api(page, "POST", "/api/admin/marketing/templates", {
    channel: "email",
    name: "Winter offer",
    locales: {
      en: {
        subject: "Hi {{firstName}}, 10% off airport rides",
        preheader: "This week only",
        body: "<h1>Winter offer</h1><p>Hello {{firstName}}, book an airport ride this week and save 10%.</p>{{unsubscribeUrl}}",
      },
    },
  });
}

async function shot(page: Page, name: string, width: number) {
  if (test.info().project.name !== "desktop") return;
  mkdirSync(SHOTS, { recursive: true });
  await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/admincust-campaign-${name}-${width}.png`, fullPage: true });
}

test.beforeEach(async () => {
  await seed();
});

test("campaigns list shows the empty state and links to the wizard", async ({ page }) => {
  await signIn(page);
  await page.goto("/en/dashboard/marketing/campaigns");
  await expect(page.getByText("No campaigns yet")).toBeVisible();
  await page.getByTestId("new-campaign").click();
  await expect(page).toHaveURL(/\/en\/dashboard\/marketing\/campaigns\/new$/);
  await expect(page.getByRole("heading", { name: "Who should get it?" })).toBeVisible();
});

test("wizard sends an email campaign and lands on its report", async ({ page }) => {
  await signIn(page);
  await seedDeskContent(page);

  await page.goto("/en/dashboard/marketing/campaigns/new");
  await page.getByLabel("Campaign name").fill("Winter airport offer");
  await page.locator("#campaign-segment").click();
  await page.getByRole("option", { name: "Loyal riders" }).click();
  await expect(page.getByTestId("audience-count")).toContainText("Will receive");
  await expect(page.getByTestId("audience-count")).toContainText("1");
  await shot(page, "wizard", 390);
  await shot(page, "wizard", 1440);
  await page.getByTestId("wizard-next").click();

  await page.locator("#campaign-template").click();
  await page.getByRole("option", { name: /Winter offer/ }).click();
  await expect(page.getByText(/10% off airport rides/)).toBeVisible();
  await page.getByTestId("wizard-next").click();

  await expect(page.getByText("Send now", { exact: true })).toBeVisible();
  await page.getByTestId("wizard-next").click();

  await expect(page.getByTestId("review-recipients")).toContainText("1");
  await page.getByTestId("campaign-submit").click();
  await expect(page).toHaveURL(/\/en\/dashboard\/marketing\/campaigns\/[a-f0-9]{24}$/);

  await page.goto("/en/dashboard/marketing/campaigns");
  const row = page.getByRole("link", { name: "Winter airport offer" }).first();
  await expect(row).toBeVisible();
  await expect(page.getByText("Scheduled").first()).toBeVisible();
  await shot(page, "list", 1440);
  await shot(page, "list", 390);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("campaign-card").first()).toBeVisible();
});
