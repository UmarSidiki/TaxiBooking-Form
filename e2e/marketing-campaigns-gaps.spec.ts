import { mkdirSync } from "node:fs";
import { chromium, devices, expect, test, webkit } from "@playwright/test";

import { configureE2eDatabase } from "./helpers/login-token";
import {
  CUSTOMER,
  SHOTS,
  api,
  seed,
  seedBulkCustomers,
  seedDeskContent,
  signIn,
} from "./helpers/marketing-ui";

const CRON_SECRET = process.env.CRON_SECRET || "e2e-cron-secret";

test("schedules in the operator time zone and shows the operator cap", async ({ page }) => {
  await seed({ timezone: "Asia/Karachi", whatsappDailyCap: 40 });
  await signIn(page);
  await seedDeskContent(page);
  await page.goto("/en/dashboard/marketing/campaigns/new");
  await expect(page.getByText(/Max 40 a day/)).toBeVisible();
  await page.getByLabel("Campaign name").fill("Karachi morning");
  await page.locator("#campaign-segment").click();
  await page.getByRole("option", { name: "Loyal riders" }).click();
  await expect(page.getByTestId("audience-count")).toContainText("1");
  await page.getByTestId("wizard-next").click();
  await page.locator("#campaign-template").click();
  await page.getByRole("option", { name: /Winter offer/ }).click();
  await page.getByTestId("wizard-next").click();
  await page.locator('input[name="timing"]').nth(1).check();
  await expect(page.getByTestId("operator-tz")).toContainText("Asia/Karachi");
  await page.locator("#campaign-send-at").fill("2030-01-15T10:00");
  await page.getByTestId("wizard-next").click();
  await expect(page.getByText(/\(Asia\/Karachi\)/)).toBeVisible();
  await page.getByTestId("campaign-submit").click();
  await expect(page).toHaveURL(/campaigns\/[a-f0-9]{24}$/);
  const id = page.url().split("/").pop()!;
  const report = await api(page, "GET", `/api/admin/marketing/campaigns/${id}/report`);
  expect(report.campaign.scheduledAt).toBe("2030-01-15T05:00:00.000Z");
  expect(report.campaign.quietHours.timeZone).toBe("Asia/Karachi");
  if (test.info().project.name === "desktop") {
    const nav = page.locator('[data-sidebar="menu-button"]', { hasText: "Campaigns" });
    await expect(nav).toHaveAttribute("data-active", "true");
    await page.goto("/en/dashboard/marketing/campaigns/new");
    await expect(nav).toHaveAttribute("data-active", "true");
  }
});

test("large sends need SEND server-side; recipients page past 500; tagged unsubscribe counts", async ({ page }) => {
  test.setTimeout(240_000);
  await seed();
  await seedBulkCustomers(520);
  await signIn(page);
  await seedDeskContent(page);
  const seg = await api(page, "GET", "/api/admin/marketing/segments");
  const tpl = await api(page, "GET", "/api/admin/marketing/templates");
  const created = await api(page, "POST", "/api/admin/marketing/campaigns", {
    name: "Big send",
    channel: "email",
    segmentId: seg.segments[0].id,
    templateId: tpl.templates[0].id,
    templateVersion: 1,
  });
  const id = created.campaign.id as string;
  const when = new Date(Date.now() + 86_400_000).toISOString();

  const noConfirm = await page.request.post(`/api/admin/marketing/campaigns/${id}/schedule`, {
    data: { scheduledAt: when },
  });
  expect(noConfirm.status()).toBe(400);
  expect((await noConfirm.json()).error).toBe("confirmation_required");
  const wrong = await page.request.post(`/api/admin/marketing/campaigns/${id}/schedule`, {
    data: { scheduledAt: when, confirmationText: "YES" },
  });
  expect(wrong.status()).toBe(400);
  await api(page, "POST", `/api/admin/marketing/campaigns/${id}/schedule`, {
    scheduledAt: when,
    confirmationText: "SEND",
  });

  const report = await api(page, "GET", `/api/admin/marketing/campaigns/${id}/report`);
  expect(report.summary.targeted).toBe(521);
  expect(report.summary.pending).toBe(521);
  expect(report.recipients).toHaveLength(50);

  // Walk every page server-side.
  let cursor: string | null = null;
  let seen = 0;
  do {
    const q: string = cursor ? `&cursor=${cursor}` : "";
    const pageData = await api(page, "GET", `/api/admin/marketing/campaigns/${id}/recipients?limit=200${q}`);
    seen += pageData.recipients.length;
    cursor = pageData.nextCursor;
  } while (cursor);
  expect(seen).toBe(521);

  await page.goto(`/en/dashboard/marketing/campaigns/${id}`);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByTestId("recipient-row")).toHaveCount(50);
  await page.getByTestId("recipients-more").click();
  await expect(page.getByTestId("recipient-row")).toHaveCount(100);

  // Tagged unsubscribe on a small, actually-sent campaign.
  await seed();
  await seedDeskContent(page);
  const seg2 = await api(page, "GET", "/api/admin/marketing/segments");
  const tpl2 = await api(page, "GET", "/api/admin/marketing/templates");
  const small = await api(page, "POST", "/api/admin/marketing/campaigns", {
    name: "Small send",
    channel: "email",
    segmentId: seg2.segments[0].id,
    templateId: tpl2.templates[0].id,
    templateVersion: 1,
  });
  await api(page, "POST", `/api/admin/marketing/campaigns/${small.campaign.id}/schedule`, {
    scheduledAt: new Date().toISOString(),
    confirmationText: "SEND",
  });
  const cron = await page.request.post(`/api/cron?secret=${encodeURIComponent(CRON_SECRET)}`);
  expect(cron.status()).toBe(200);
  configureE2eDatabase();
  process.env.NEXTAUTH_SECRET = "e2e-secret-not-for-production";
  const { signUnsubscribeToken } = await import("../src/features/marketing/lib/unsubscribe/unsubscribe-token");
  const token = signUnsubscribeToken({ email: CUSTOMER, channel: "email", locale: "en", campaignId: small.campaign.id });
  const unsub = await page.request.post(`/api/marketing/unsubscribe?token=${encodeURIComponent(token!)}`);
  expect(unsub.status()).toBe(200);
  const after = await api(page, "GET", `/api/admin/marketing/campaigns/${small.campaign.id}/report`);
  expect(after.summary.sent).toBeGreaterThanOrEqual(1);
  expect(after.summary.unsubscribed).toBe(1);
});

test("screenshots across widths and mobile engines; filters never scroll sideways", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "screenshots once");
  test.setTimeout(300_000);
  await seed();
  await signIn(page);
  await seedDeskContent(page);
  const seg = await api(page, "GET", "/api/admin/marketing/segments");
  const tpl = await api(page, "GET", "/api/admin/marketing/templates");
  const c = await api(page, "POST", "/api/admin/marketing/campaigns", {
    name: "Winter airport offer",
    channel: "email",
    segmentId: seg.segments[0].id,
    templateId: tpl.templates[0].id,
    templateVersion: 1,
  });
  await api(page, "POST", `/api/admin/marketing/campaigns/${c.campaign.id}/schedule`, {
    scheduledAt: new Date().toISOString(),
  });
  await page.request.post(`/api/cron?secret=${encodeURIComponent(CRON_SECRET)}`);
  mkdirSync(SHOTS, { recursive: true });
  const pages = {
    list: "/en/dashboard/marketing/campaigns",
    wizard: "/en/dashboard/marketing/campaigns/new",
    report: `/en/dashboard/marketing/campaigns/${c.campaign.id}`,
  };
  const ready = async (p: typeof page, name: string) => {
    if (name === "list") await expect(p.getByText("Winter airport offer").locator("visible=true").first()).toBeVisible();
    if (name === "wizard") await expect(p.getByLabel("Campaign name")).toBeVisible();
    if (name === "report") await expect(p.getByText(CUSTOMER).locator("visible=true").first()).toBeVisible();
    await p.waitForTimeout(400);
  };
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const [name, url] of Object.entries(pages)) {
      await page.goto(url);
      await ready(page, name);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${name}@${width} horizontal overflow`).toBeLessThanOrEqual(0);
      if (name === "report") {
        const filters = page.getByTestId("recipient-filters");
        const sideways = await filters.evaluate((el) => el.scrollWidth - el.clientWidth);
        expect(sideways, `filters@${width}`).toBeLessThanOrEqual(0);
      }
      await page.screenshot({ path: `${SHOTS}/admincust-campaign-${name}-${width}.png`, fullPage: true });
    }
  }
  const state = await page.context().storageState();
  for (const [label, engine, device] of [
    ["android-chromium", chromium, devices["Pixel 7"]],
    ["ios-webkit", webkit, devices["iPhone 13"]],
  ] as const) {
    const browser = await engine.launch();
    const ctx = await browser.newContext({ ...device, storageState: state, baseURL: "http://127.0.0.1:3000" });
    const p = await ctx.newPage();
    for (const [name, url] of Object.entries(pages)) {
      await p.goto(url);
      await ready(p, name);
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${name}@${label} horizontal overflow`).toBeLessThanOrEqual(0);
      await p.screenshot({ path: `${SHOTS}/admincust-campaign-${name}-${label}.png`, fullPage: true });
    }
    await browser.close();
  }
});
