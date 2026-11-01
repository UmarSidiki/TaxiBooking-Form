import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

import { signInAdmin } from "./sign-in";
import { configureE2eDatabase } from "./login-token";

export const SHOTS = "/workspace/shots";
export const CUSTOMER = "ada.ui@example.com";

export async function seed(options: { timezone?: string; whatsappDailyCap?: number } = {}) {
  configureE2eDatabase();
  process.env.NEXTAUTH_SECRET = "e2e-secret-not-for-production";
  const { connectDB } = await import("../../src/shared/db");
  const mongoose = await connectDB();
  const db = mongoose.connection.db!;
  await db.collection("campaigns").deleteMany({});
  await db.collection("campaignrecipients").deleteMany({});
  await db.collection("segments").deleteMany({});
  await db.collection("campaigntemplates").deleteMany({});
  // Own the customer set: other specs leave customers behind in the shared e2e DB.
  await db.collection("customerstats").deleteMany({});
  await db.collection("customerprofiles").deleteMany({});
  await db.collection("marketingconsents").deleteMany({});
  await db.collection("suppressions").deleteMany({});
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
        timezone: options.timezone ?? "UTC",
        marketingWhatsappDailyCap: options.whatsappDailyCap ?? 100,
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

export async function signIn(page: Page) {
  await signInAdmin(page);
  await page.waitForURL(/\/dashboard\/(home|today)/, { timeout: 120_000 }).catch(() => undefined);
  await page.waitForLoadState("networkidle").catch(() => undefined);
}

export async function api(page: Page, method: string, url: string, data?: unknown) {
  const res = await page.request.fetch(url, {
    method,
    data,
    headers: { "Content-Type": "application/json" },
  });
  expect(res.ok(), `${method} ${url} -> ${res.status()}`).toBeTruthy();
  return res.json();
}

export async function seedDeskContent(page: Page) {
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

export async function shot(page: Page, name: string, width: number) {
  if (test.info().project.name !== "desktop") return;
  mkdirSync(SHOTS, { recursive: true });
  await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/admincust-campaign-${name}-${width}.png`, fullPage: true });
}


/** Adds `count` email-opted-in customers (bulk) for large-send tests. */
export async function seedBulkCustomers(count: number) {
  configureE2eDatabase();
  const { connectDB } = await import("../../src/shared/db");
  const mongoose = await connectDB();
  const db = mongoose.connection.db!;
  const now = new Date();
  await db.collection("customerstats").deleteMany({ emailLower: /^bulk\d+@example\.com$/ });
  await db.collection("customerprofiles").deleteMany({ email: /^bulk\d+@example\.com$/ });
  const stats = [];
  const profiles = [];
  for (let i = 0; i < count; i++) {
    const email = `bulk${i}@example.com`;
    stats.push({
      emailLower: email,
      name: `Bulk ${i}`,
      nameLower: `bulk ${i}`,
      phoneDigits: `4199${String(i).padStart(7, "0")}`,
      rideCount: 1,
      completedCount: 1,
      totalSpendMinor: 1000,
      currency: "EUR",
      firstRideAt: now,
      lastRideAt: now,
      hasUpcoming: false,
      locale: "en",
      emailConsent: "granted",
      whatsappConsent: "none",
      rebuiltAt: now,
    });
    profiles.push({
      email,
      name: `Bulk ${i}`,
      marketing: {
        email: { status: "granted", at: now, source: "account" },
        whatsapp: { status: "none", at: null, source: "" },
      },
      language: "en",
    });
  }
  await db.collection("customerstats").insertMany(stats);
  await db.collection("customerprofiles").insertMany(profiles);
}
