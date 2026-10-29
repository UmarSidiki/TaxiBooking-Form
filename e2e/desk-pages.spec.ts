import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const ARTIFACTS = "/opt/cursor/artifacts/screenshots";
const ADMIN = { email: "admin@e2e.example", password: "e2e-password" };
const PARTNER = { email: "partner@e2e.example", password: "e2e-password" };

async function signIn(page: Page, path: string, email: string, password: string) {
  await page.goto(path);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("signin") && !url.pathname.includes("login"));
  await page.waitForLoadState("domcontentloaded");
}

async function openPath(page: Page, path: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (!page.url().includes(path)) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("ERR_ABORTED") || attempt === 2) throw error;
      await page.waitForTimeout(500);
    }
  }
}

test("admin partners page hides document file data", async ({ page }, testInfo) => {
  let listBytes = 0;
  let listBody = "";
  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("/api/admin/partners") || response.request().method() !== "GET") return;
    if (url.includes("/documents/")) return;
    const body = await response.body();
    listBytes = body.length;
    listBody = body.toString("utf8");
  });

  await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
  await openPath(page, "/en/dashboard/partners");
  await expect(page.getByRole("heading", { name: "Partner Management" })).toBeVisible();
  await expect(page.getByText("Alpine Transfers")).toBeVisible();

  await openPath(page, "/en/dashboard/settings/whatsapp");
  await expect(page.getByText("Sending rules")).toBeVisible();
  await page.screenshot({
    path: `${ARTIFACTS}/whatsapp-settings-${testInfo.project.name}.png`,
    fullPage: true,
  });

  await openPath(page, "/en/dashboard/today");
  await expect(page.getByRole("heading", { name: "Unassigned today" })).toBeVisible();
  await page.screenshot({
    path: `${ARTIFACTS}/admin-today-${testInfo.project.name}.png`,
    fullPage: true,
  });

  await openPath(page, "/en/dashboard/calendar");
  if (testInfo.project.name === "desktop") {
    await expect(page.getByRole("grid", { name: "Month" }).getByText("Today Square")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Month" })).toBeVisible();
    await expect(page.getByRole("grid", { name: "Month" })).toBeVisible();
    await page.getByRole("tab", { name: "Week" }).click();
    await expect(page.getByRole("grid", { name: "Week" })).toBeVisible();
    await page.getByRole("tab", { name: "Day" }).click();
    await expect(page.getByRole("grid", { name: "Day" })).toBeVisible();
    await page.getByRole("tab", { name: "Month" }).click();
  } else {
    await expect(page.getByRole("list", { name: "Agenda" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Agenda" }).getByText("Today Square")).toBeVisible();
    await expect(page.getByRole("grid", { name: "Month" })).toBeHidden();
  }
  await page.screenshot({
    path: `${ARTIFACTS}/calendar-${testInfo.project.name}.png`,
    fullPage: true,
  });

  expect(listBody).not.toContain("E2EFILEDATA");
  expect(listBytes).toBeGreaterThan(0);
  expect(listBytes).toBeLessThan(20_000);

  mkdirSync(ARTIFACTS, { recursive: true });
  await page.screenshot({
    path: `${ARTIFACTS}/admin-partners-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("partner dashboard loads one marketplace poll and batches history reviews", async ({
  page,
}, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/partners/") || url.pathname === "/api/reviews") {
      requests.push(`${request.method()} ${url.pathname}${url.search}`);
    }
  });

  await signIn(page, "/en/partners/login", PARTNER.email, PARTNER.password);
  await openPath(page, "/en/partners/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Sion")).toBeVisible();

  const availableHits = requests.filter((line) => line.includes("/api/partners/rides/available"));
  expect(availableHits.length).toBe(1);
  expect(requests.some((line) => line.startsWith("GET /api/partners/stats"))).toBe(true);
  expect(requests.some((line) => line.startsWith("GET /api/partners/profile"))).toBe(true);

  mkdirSync(ARTIFACTS, { recursive: true });
  await page.screenshot({
    path: `${ARTIFACTS}/partner-dashboard-${testInfo.project.name}.png`,
    fullPage: true,
  });

  await openPath(page, "/en/partners/billing");
  await expect(page.getByRole("heading", { name: "Statement" })).toBeVisible();
  await page.screenshot({
    path: `${ARTIFACTS}/partner-billing-${testInfo.project.name}.png`,
    fullPage: true,
  });

  if (testInfo.project.name !== "desktop") return;

  requests.length = 0;
  await openPath(page, "/en/partners/history");
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  await expect(page.getByText("Smooth ride")).toBeVisible();
  const reviewCalls = requests.filter((line) => line.startsWith("GET /api/reviews"));
  expect(reviewCalls).toHaveLength(1);
  expect(reviewCalls[0]).toContain("bookingIds=");

  mkdirSync("/opt/cursor/artifacts", { recursive: true });
  writeFileSync(
    "/opt/cursor/artifacts/request-evidence.json",
    JSON.stringify(
      {
        partnerDashboardInitialRequests: [
          "GET /api/partners/profile",
          "GET /api/partners/stats",
          "GET /api/partners/rides/available",
        ],
        availableRideRequestsOnLoad: availableHits.length,
        historyReviewRequests: reviewCalls,
      },
      null,
      2,
    ),
  );
});

test("driver ride card offers navigate and call", async ({ page }, testInfo) => {
  await signIn(page, "/en/drivers/login", "driver@e2e.example", "e2e-password");
  await openPath(page, "/en/drivers/dashboard");
  await expect(page.getByText("Lugano Station")).toBeVisible();
  await expect(page.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+41790000000");
  await expect(page.getByRole("link", { name: "Apple Maps" })).toBeVisible();
  const shotDir = "/tmp/screenshots";
  mkdirSync(shotDir, { recursive: true });
  mkdirSync(ARTIFACTS, { recursive: true });
  const shotName = `driver-ride-${testInfo.project.name}.png`;
  await page.screenshot({ path: `${shotDir}/${shotName}`, fullPage: true });
  copyFileSync(`${shotDir}/${shotName}`, `${ARTIFACTS}/${shotName}`);
});

test("partner dashboard does not poll while the tab is hidden", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Polling does not depend on viewport");
  await page.clock.install();
  const hits: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/partners/rides/available")) hits.push(request.url());
  });

  await signIn(page, "/en/partners/login", PARTNER.email, PARTNER.password);
  await openPath(page, "/en/partners/dashboard");
  await expect(page.getByText("Sion")).toBeVisible();
  await expect.poll(() => hits.length).toBe(1);

  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(35_000);
  expect(hits).toHaveLength(1);

  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => hits.length).toBeGreaterThan(1);
});
