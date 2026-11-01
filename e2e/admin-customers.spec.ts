import { expect, test, type Page } from "@playwright/test";

import { signInAdmin } from "./helpers/sign-in";
import { configureE2eDatabase } from "./helpers/login-token";

const ADMIN_EMAIL = "ada@example.com";
const SECOND_EMAIL = "grace@example.com";
const NOTE_TEXT = "E2E admin note";

async function seedCustomers() {
  configureE2eDatabase();
  process.env.NEXTAUTH_SECRET = "e2e-secret-not-for-production";
  const { connectDB } = await import("../src/shared/db");
  const mongoose = await connectDB();
  const db = mongoose.connection.db!;
  const now = new Date();

  await db.collection("customerstats").updateOne(
    { emailLower: ADMIN_EMAIL },
    {
      $set: {
        emailLower: ADMIN_EMAIL,
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

  await db.collection("customerstats").updateOne(
    { emailLower: SECOND_EMAIL },
    {
      $set: {
        emailLower: SECOND_EMAIL,
        name: "Grace Hopper",
        nameLower: "grace hopper",
        phoneDigits: "41000000003",
        verifiedPhone: "+41000000003",
        rideCount: 1,
        completedCount: 1,
        totalSpendMinor: 5000,
        currency: "EUR",
        firstRideAt: new Date("2024-01-15T08:00:00.000Z"),
        lastRideAt: new Date("2024-01-15T08:00:00.000Z"),
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
    { email: ADMIN_EMAIL },
    {
      $set: {
        email: ADMIN_EMAIL,
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

  const sessionHash = "e2e-session-hash-1";
  await db.collection("customersessions").updateOne(
    { idHash: sessionHash },
    {
      $set: {
        idHash: sessionHash,
        emailLower: ADMIN_EMAIL,
        createdAt: now,
        lastSeenAt: now,
        expiresAt: new Date(now.getTime() + 86400000),
        uaFamily: "desktop",
        ipPrefix: "127.0.0",
        revokedAt: null,
      },
    },
    { upsert: true },
  );
}

test.beforeAll(async () => {
  await seedCustomers();
});

async function openCustomers(page: Page) {
  await signInAdmin(page);
  const width = page.viewportSize()?.width ?? 1280;
  if (width < 768) {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.waitForTimeout(500);
  }
  await page.getByRole("link", { name: "All customers" }).click();
  await page.waitForURL(/\/dashboard\/customers/, { timeout: 30000 });
  await page.waitForTimeout(1000);
  await expect(page.getByPlaceholder("Search email, name or phone")).toBeVisible();
}

async function openProfile(page: Page) {
  await openCustomers(page);
  await page.getByRole("link", { name: "Ada Lovelace" }).first().click();
  await page.waitForURL(/customers\/ada/i);
  await page.waitForTimeout(1000);
  await expect(page.getByText(ADMIN_EMAIL).first()).toBeVisible();
}

test("customers list filters by search", async ({ page }) => {
  await openCustomers(page);
  await expect(page.getByRole("link", { name: "Ada Lovelace" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Grace Hopper" })).toHaveCount(1);

  const search = page.getByPlaceholder("Search email, name or phone");
  await search.fill("grace@example.com");
  await expect(page.getByRole("link", { name: "Grace Hopper" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Ada Lovelace" })).toHaveCount(0);
});

test("customer profile tabs and revoke all sessions", async ({ page }) => {
  await openProfile(page);

  for (const tab of ["Bookings", "Payments", "Sessions", "WhatsApp", "Marketing", "Notes", "Activity"]) {
    await page.getByRole("tab", { name: tab }).click();
  }

  await page.getByRole("tab", { name: "Sessions" }).click();
  await page.getByRole("button", { name: "Sign out everywhere" }).first().click();
  await page.getByRole("button", { name: "Sign out everywhere" }).last().click();
  await expect(page.getByText("Revoked").first()).toBeVisible();
});

test("customer notes create", async ({ page }) => {
  await openProfile(page);
  await page.getByRole("tab", { name: "Notes" }).click();
  const textarea = page.getByPlaceholder("Write an internal note…");
  await textarea.fill(NOTE_TEXT);
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByRole("listitem").getByText(NOTE_TEXT).first()).toBeVisible();
});

test("customers CSV download", async ({ page }) => {
  await openCustomers(page);
  const res = await page.request.get("/api/admin/customers/export");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("ada@example.com");
  expect(body.charCodeAt(0)).toBe(0xfeff);
});
