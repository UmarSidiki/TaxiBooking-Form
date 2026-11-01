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

const CRON_SECRET = process.env.CRON_SECRET || "e2e-cron-secret";

async function createScheduled(page: Page, name: string) {
  const seg = await api(page, "GET", "/api/admin/marketing/segments");
  const tpl = await api(page, "GET", "/api/admin/marketing/templates");
  const created = await api(page, "POST", "/api/admin/marketing/campaigns", {
    name,
    channel: "email",
    segmentId: seg.segments[0].id,
    templateId: tpl.templates[0].id,
    templateVersion: 1,
  });
  const id = created.campaign.id as string;
  await api(page, "POST", `/api/admin/marketing/campaigns/${id}/schedule`, {
    scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
  });
  return id;
}

test("report shows delivery metrics and pause, resume, cancel work", async ({ page }) => {
  await signIn(page);
  await seedDeskContent(page);

  // A sent campaign: schedule now and run the scheduler once.
  const seg = await api(page, "GET", "/api/admin/marketing/segments");
  const tpl = await api(page, "GET", "/api/admin/marketing/templates");
  const sent = await api(page, "POST", "/api/admin/marketing/campaigns", {
    name: "Sent campaign",
    channel: "email",
    segmentId: seg.segments[0].id,
    templateId: tpl.templates[0].id,
    templateVersion: 1,
  });
  await api(page, "POST", `/api/admin/marketing/campaigns/${sent.campaign.id}/schedule`, {
    scheduledAt: new Date().toISOString(),
  });
  const cron = await page.request.post(`/api/cron?secret=${encodeURIComponent(CRON_SECRET)}`);
  expect(cron.status()).toBe(200);

  await page.goto(`/en/dashboard/marketing/campaigns/${sent.campaign.id}`);
  await expect(page.getByTestId("report-name")).toHaveText("Sent campaign");
  await expect(page.getByText("Done", { exact: true }).first()).toBeVisible();
  const metrics = page.getByTestId("report-metrics");
  await expect(metrics).toContainText("Targeted");
  await expect(metrics).toContainText("Bookings after");
  await expect(page.getByTestId("recipient-row").first()).toContainText(CUSTOMER);
  await expect(page.getByTestId("campaign-pause")).toHaveCount(0);
  await shot(page, "report", 1440);
  await shot(page, "report", 390);

  // A future campaign: pause, resume, cancel.
  await page.setViewportSize({ width: 1280, height: 800 });
  const futureId = await createScheduled(page, "Future campaign");
  await page.goto(`/en/dashboard/marketing/campaigns/${futureId}`);
  await expect(page.getByText("Scheduled", { exact: true }).first()).toBeVisible();
  await page.getByTestId("campaign-pause").click();
  await expect(page.getByTestId("campaign-resume")).toBeVisible();
  await expect(page.getByText("Paused", { exact: true }).first()).toBeVisible();
  await page.getByTestId("campaign-resume").click();
  await expect(page.getByTestId("campaign-pause")).toBeVisible();
  await page.getByTestId("campaign-cancel").click();
  await page.getByTestId("campaign-cancel-confirm").click();
  await expect(page.getByText("Cancelled", { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("campaign-cancel")).toHaveCount(0);

  const audit = await api(page, "GET", "/api/admin/audit?targetType=campaign");
  const actions = JSON.stringify(audit);
  expect(actions).toContain("campaign.pause");
  expect(actions).toContain("campaign.resume");
});

test("unknown campaign id shows a not-found state", async ({ page }) => {
  await signIn(page);
  await page.goto("/en/dashboard/marketing/campaigns/0123456789abcdef01234567");
  await expect(page.getByText("This campaign doesn't exist or was deleted.")).toBeVisible();
});

test("report renders in Arabic RTL", async ({ page }) => {
  await signIn(page);
  await seedDeskContent(page);
  const id = await createScheduled(page, "RTL campaign");
  await page.goto(`/ar/dashboard/marketing/campaigns/${id}`);
  await expect(page.getByText("تقرير الحملة").or(page.getByTestId("report-name"))).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId("campaign-pause")).toContainText("إيقاف مؤقت");
});
