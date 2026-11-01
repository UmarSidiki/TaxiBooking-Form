import { expect, test, type Page } from "@playwright/test";

import { signInAdmin } from "./helpers/sign-in";
import { configureE2eDatabase } from "./helpers/login-token";

const CRON_SECRET = process.env.CRON_SECRET || "e2e-cron-secret";
const EMAIL_CUSTOMER = "ada@example.com";
const WA_CUSTOMERS = ["wa1@example.com", "wa2@example.com", "wa3@example.com"];

async function seedMarketing() {
  configureE2eDatabase();
  process.env.NEXTAUTH_SECRET = "e2e-secret-not-for-production";
  const { connectDB } = await import("../src/shared/db");
  const mongoose = await connectDB();
  const db = mongoose.connection.db!;
  await db.collection("campaigns").deleteMany({});
  await db.collection("campaignrecipients").deleteMany({});
  await db.collection("whatsappsendlogs").deleteMany({});
  const now = new Date();

  await db.collection("customerstats").updateOne(
    { emailLower: EMAIL_CUSTOMER },
    {
      $set: {
        emailLower: EMAIL_CUSTOMER,
        name: "Ada Lovelace",
        nameLower: "ada lovelace",
        phoneDigits: "41000000002",
        verifiedPhone: "+41000000002",
        rideCount: 1,
        completedCount: 1,
        totalSpendMinor: 8000,
        currency: "EUR",
        firstRideAt: now,
        lastRideAt: now,
        hasUpcoming: true,
        locale: "en",
        emailConsent: "granted",
        whatsappConsent: "none",
        rebuiltAt: now,
      },
    },
    { upsert: true },
  );

  for (let i = 0; i < WA_CUSTOMERS.length; i++) {
    const email = WA_CUSTOMERS[i];
    const phone = `+4100000010${i}`;
    const digits = phone.replace(/\D/g, "");
    await db.collection("customerstats").updateOne(
      { emailLower: email },
      {
        $set: {
          emailLower: email,
          name: `WA Customer ${i + 1}`,
          nameLower: `wa customer ${i + 1}`,
          phoneDigits: digits,
          verifiedPhone: phone,
          rideCount: 1,
          completedCount: 1,
          totalSpendMinor: 5000,
          currency: "EUR",
          firstRideAt: now,
          lastRideAt: now,
          hasUpcoming: false,
          locale: "en",
          emailConsent: "none",
          whatsappConsent: "granted",
          rebuiltAt: now,
        },
      },
      { upsert: true },
    );

    await db.collection("customerprofiles").updateOne(
      { email },
      {
        $set: {
          email,
          name: `WA Customer ${i + 1}`,
          verifiedPhone: phone,
          verifiedPhoneAt: now,
          marketing: {
            email: { status: "none", at: null, source: "" },
            whatsapp: { status: "granted", at: now, source: "account" },
          },
          language: "en",
        },
      },
      { upsert: true },
    );
  }

  await db.collection("customerprofiles").updateOne(
    { email: EMAIL_CUSTOMER },
    {
      $set: {
        email: EMAIL_CUSTOMER,
        name: "Ada Lovelace",
        verifiedPhone: "+41000000002",
        verifiedPhoneAt: now,
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
        marketingReplyTo: "reply@example.com",
        smtpFrom: "bookings@example.com",
        smtpSenderName: "Bookings",
        marketingTestRecipients: ["admin@e2e.example"],
        marketingWhatsappDailyCap: 2,
        marketingTrackOpens: false,
        marketingTrackClicks: false,
      },
    },
    { upsert: true },
  );
}

test.beforeAll(async () => {
  await seedMarketing();
});

async function api(page: Page, method: string, url: string, body?: unknown) {
  const res = await page.request.fetch(url, {
    method,
    data: body,
    headers: { "Content-Type": "application/json" },
  });
  return res;
}

test("email campaign create, test send, schedule and tick", async ({ page }) => {
  await signInAdmin(page);

  // segment
  const segRes = await api(page, "POST", "/api/admin/marketing/segments", {
    name: "All customers",
    filter: {},
  });
  expect(segRes.status()).toBe(201);
  const segJson = await segRes.json();
  const segmentId = segJson.segment.id;

  // template
  const tplRes = await api(page, "POST", "/api/admin/marketing/templates", {
    channel: "email",
    name: "Welcome email",
    locales: {
      en: {
        subject: "Hi {{firstName}}",
        preheader: "",
        body: "<p>Hello {{firstName}}</p>{{unsubscribeUrl}}",
      },
    },
  });
  expect(tplRes.status()).toBe(201);
  const tplJson = await tplRes.json();
  const templateId = tplJson.template.id;

  // test send
  const testRes = await api(page, "POST", `/api/admin/marketing/templates/${templateId}/test-send`, {
    recipient: "admin@e2e.example",
    locale: "en",
  });
  expect(testRes.status()).toBe(200);
  const testJson = await testRes.json();
  expect(testJson.success).toBe(true);

  // campaign (draft)
  const campRes = await api(page, "POST", "/api/admin/marketing/campaigns", {
    name: "E2E email campaign",
    channel: "email",
    segmentId,
    templateId,
    templateVersion: 1,
  });
  expect(campRes.status()).toBe(201);
  const campJson = await campRes.json();
  const campaignId = campJson.campaign.id;

  // schedule now
  const schedRes = await api(page, "POST", `/api/admin/marketing/campaigns/${campaignId}/schedule`, {
    scheduledAt: new Date().toISOString(),
  });
  expect(schedRes.status()).toBe(200);

  // tick via cron
  const cronRes = await page.request.post(`/api/cron?secret=${encodeURIComponent(CRON_SECRET)}`);
  expect(cronRes.status()).toBe(200);

  // report
  const reportRes = await page.request.get(`/api/admin/marketing/campaigns/${campaignId}/report`);
  expect(reportRes.status()).toBe(200);
  const reportJson = await reportRes.json();
  expect(reportJson.campaign.status).toBe("done");
  const sent = reportJson.recipients.filter((r: any) => r.status === "sent").length;
  expect(sent).toBeGreaterThanOrEqual(1);
});

test("whatsapp campaign respects daily cap", async ({ page }) => {
  await seedMarketing();
  await signInAdmin(page);

  const segRes = await api(page, "POST", "/api/admin/marketing/segments", {
    name: "WA customers",
    filter: {},
  });
  expect(segRes.status()).toBe(201);
  const segmentId = (await segRes.json()).segment.id;

  const tplRes = await api(page, "POST", "/api/admin/marketing/templates", {
    channel: "whatsapp",
    name: "WA offer",
    locales: {
      en: {
        subject: "",
        preheader: "",
        body: "Hi {{firstName}} Reply STOP to unsubscribe",
      },
    },
  });
  expect(tplRes.status()).toBe(201);
  const templateId = (await tplRes.json()).template.id;

  const campRes = await api(page, "POST", "/api/admin/marketing/campaigns", {
    name: "E2E wa campaign",
    channel: "whatsapp",
    segmentId,
    templateId,
    templateVersion: 1,
    quietHours: { startHour: 0, endHour: 0, timeZone: "UTC" },
  });
  expect(campRes.status()).toBe(201);
  const campaignId = (await campRes.json()).campaign.id;

  const schedRes = await api(page, "POST", `/api/admin/marketing/campaigns/${campaignId}/schedule`, {
    scheduledAt: new Date().toISOString(),
  });
  expect(schedRes.status()).toBe(200);

  let sent = 0;
  let pending = 0;
  let reportJson: any = null;
  for (let i = 0; i < 10; i++) {
    const cronRes = await page.request.post(`/api/cron?secret=${encodeURIComponent(CRON_SECRET)}`);
    expect(cronRes.status()).toBe(200);
    const cronJson = await cronRes.json();
    expect(cronJson?.ok).toBeTruthy();

    const reportRes = await page.request.get(`/api/admin/marketing/campaigns/${campaignId}/report`);
    expect(reportRes.status()).toBe(200);
    reportJson = await reportRes.json();
    sent = reportJson.recipients.filter((r: any) => r.status === "sent").length;
    pending = reportJson.recipients.filter((r: any) => r.status === "pending" || r.status === "sending").length;
    if (sent >= 2 || pending === 0) break;
    await page.waitForTimeout(300);
  }

  expect(sent).toBe(2);
  expect(pending).toBeGreaterThanOrEqual(1);
});
