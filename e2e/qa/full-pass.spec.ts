import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  ADMIN,
  ALPINE,
  card,
  LAKE,
  gotoPath,
  layoutId,
  NIA,
  openFresh,
  portalShots,
  shot,
  signIn,
  step,
  writeReport,
  type StepResult,
} from "./support";

const DEPART = "2026-12-15";
const RETURN = "2026-12-16";

async function showUpcoming(page: Page) {
  await page.getByRole("tab", { name: "Upcoming" }).click();
}

async function showCalendar(page: Page, name: "Month" | "Week" | "Day") {
  const grid = page.getByRole("grid", { name });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await grid.isVisible().catch(() => false)) return;
    await page.getByRole("tab", { name }).click();
    try {
      await expect(grid).toBeVisible({ timeout: 5_000 });
      return;
    } catch {
      // A dev refresh can remount the board on its month view.
    }
  }
  await expect(grid).toBeVisible();
}

async function fillWhen(page: Page, roundTrip: boolean) {
  await page.locator('input[type="date"]').first().fill(DEPART);
  await page.locator('input[type="time"]').first().fill("09:30");
  if (!roundTrip) return;
  const round = page.getByRole("button", { name: "Round Trip" });
  if (await round.count()) await round.first().click();
  await page.locator('input[type="date"]').nth(1).fill(RETURN);
  await page.locator('input[type="time"]').nth(1).fill("18:00");
}

async function reachVehicles(page: Page, pickup: string, dropoff: string, roundTrip: boolean) {
  const pickupField = page.getByPlaceholder(pickup).first();
  const dropoffField = page.getByPlaceholder(dropoff).first();
  await expect(async () => {
    await pickupField.fill("Geneva Airport");
    await dropoffField.fill("Lausanne Station");
    await expect(pickupField).toHaveValue("Geneva Airport");
    await expect(dropoffField).toHaveValue("Lausanne Station");
  }).toPass();
  await fillWhen(page, roundTrip);
  if ((await pickupField.inputValue()) !== "Geneva Airport") await pickupField.fill("Geneva Airport");
  if ((await dropoffField.inputValue()) !== "Lausanne Station") await dropoffField.fill("Lausanne Station");
  await pickupField.blur();
  await page.waitForTimeout(400);
}

test("manual QA pass", async ({ page, browser }) => {
  test.setTimeout(600_000);
  page.setDefaultTimeout(20_000);
  page.setDefaultNavigationTimeout(60_000);
  const results: StepResult[] = [];
  let oneWay = "";
  let roundTrip = "";
  let payUrl = "";

  await step(page, results, "customer-v1", async () => {
    await openFresh(page, "/en/embeddable/v1");
    await reachVehicles(page, "Pickup", "Destination", false);
    await shot(page, "customer-v1-form");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/step=2/);
    await expect(page.getByRole("button", { name: "Select" }).first()).toBeVisible();
    oneWay = (await page.locator("text=/€\\s*\\d+\\.\\d{2}/").first().textContent()) ?? "";
    await shot(page, "customer-v1-vehicles");
  });

  await step(page, results, "customer-return-price", async () => {
    await openFresh(page, "/en/embeddable/v1");
    await reachVehicles(page, "Pickup", "Destination", true);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("button", { name: "Select" }).first()).toBeVisible();
    roundTrip = (await page.locator("text=/€\\s*\\d+\\.\\d{2}/").first().textContent()) ?? "";
    const one = Number(oneWay.replace(/[^\d.]/g, ""));
    const back = Number(roundTrip.replace(/[^\d.]/g, ""));
    expect(back).toBeGreaterThan(one);
    expect(back).toBeLessThan(one * 2);
    await shot(page, "customer-return-price");
  });

  for (const version of ["v2", "v3", "v4"] as const) {
    await step(page, results, `customer-${version}`, async () => {
      await openFresh(page, `/en/embeddable/${version}`);
      if (version === "v4") {
        const streets = page.getByPlaceholder("street and number…");
        await streets.nth(0).fill("Geneva Airport");
        await streets.nth(1).fill("Lausanne Station");
        await fillWhen(page, false);
        await streets.nth(0).blur();
        await page.getByRole("button", { name: "Calculate my fare" }).click();
      } else {
        await reachVehicles(page, "Pickup", "Destination", false);
        await page.getByRole("button", { name: "Search" }).click();
      }
      await expect(page).toHaveURL(/step=2/);
      await shot(page, `customer-${version}-vehicles`);
    });
  }

  await step(page, results, "customer-custom-form", async () => {
    await openFresh(page, `/en/embeddable/custom/${layoutId()}`);
    await expect(page.getByText("QA custom form")).toBeVisible();
    await page.getByPlaceholder("Custom pickup").fill("Geneva Airport");
    await page.getByPlaceholder("Custom dropoff").fill("Lausanne Station");
    await page.locator('input[type="date"]').fill(DEPART);
    await page.locator('input[type="time"]').fill("09:30");
    await shot(page, "customer-custom-form");
    await page.getByRole("button", { name: "Search custom" }).click();
    await expect(page).toHaveURL(/step=2/);
    await shot(page, "customer-custom-vehicles");
  });

  await step(page, results, "customer-cash-booking", async () => {
    await openFresh(page, "/en");
    await reachVehicles(page, "Enter pickup address", "Enter destination address", false);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Select" }).first().click();
    await page.getByPlaceholder("John").first().fill("Ada");
    await page.getByPlaceholder("Doe").first().fill("Lovelace");
    await page.getByPlaceholder("john.doe@example.com").first().fill("ada.cash@qa.example");
    await page.getByPlaceholder("+41 76 123 4567").first().fill("+14155552671");
    await shot(page, "customer-cash-details");
    const created = page.waitForResponse((response) =>
      response.url().includes("/api/booking") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /Confirm Booking/ }).click({ force: true });
    const response = await created;
    expect(response.ok()).toBeTruthy();
    await page.waitForURL(/thank-you/);
    await shot(page, "customer-thank-you");
  });

  await step(page, results, "customer-appointment", async () => {
    await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
    await gotoPath(page, "/en/dashboard/settings/modules");
    await page.locator("#enableAppointmentRequest").click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await shot(page, "admin-appointment-toggle");
    await openFresh(page, "/en");
    await reachVehicles(page, "Enter pickup address", "Enter destination address", false);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Select" }).first().click();
    await page.getByPlaceholder("John").first().fill("Grace");
    await page.getByPlaceholder("Doe").first().fill("Hopper");
    await page.getByPlaceholder("john.doe@example.com").first().fill("grace.quote@qa.example");
    await page.getByPlaceholder("+41 76 123 4567").first().fill("+14155552671");
    await page.getByRole("button", { name: "Request this appointment" }).click({ force: true });
    await page.waitForURL(/thank-you/);
    await expect(page.getByText("Request received")).toBeVisible();
    await shot(page, "customer-appointment-received");
  });

  await step(page, results, "admin-today-and-rides", async () => {
    await gotoPath(page, "/en/dashboard/today");
    await expect(page.getByRole("heading", { name: "Unassigned today" })).toBeVisible();
    await expect(page.getByText("Today Square")).toBeVisible();
    await shot(page, "admin-today-desktop");
    await gotoPath(page, "/en/dashboard/rides");
    await showUpcoming(page);
    await expect(page.getByRole("heading", { name: "Trip #qatoday1" })).toBeVisible();
    await shot(page, "admin-rides-desktop");
  });

  await step(page, results, "admin-partner-review", async () => {
    await showUpcoming(page);
    const review = card(page, "qareview");
    await expect(review).toBeVisible();
    await review.getByRole("button", { name: /Approve for Partners|Update & Notify/ }).click();
    await shot(page, "admin-partner-review");
    await page.getByRole("button", { name: /Approve for Partners|Update & Notify Partners/ }).last().click();
    await expect(page.getByRole("status")).toContainText(/margin|notif/i);
  });

  await step(page, results, "admin-overlap-warning", async () => {
    await showUpcoming(page);
    const ride = card(page, "qaovlapb");
    await ride.getByRole("button", { name: "Assign" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: /Nia Driver/ }).click();
    await dialog.getByRole("button", { name: "Assign" }).click();
    await expect(page.getByRole("status")).toContainText("qaovlapa");
    await shot(page, "admin-overlap-warning");
  });

  await step(page, results, "admin-direct-assign-partner", async () => {
    await gotoPath(page, "/en/dashboard/rides");
    await showUpcoming(page);
    const ride = card(page, "qatoday1");
    await ride.getByRole("button", { name: "Assign" }).nth(1).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: /Lake Vans/ }).click();
    await dialog.getByRole("button", { name: /Assign|Approve/ }).click();
    await expect(ride).toContainText("Lake Vans");
    await shot(page, "admin-assign-partner");
  });

  await step(page, results, "admin-edit-activity-cancel", async () => {
    await gotoPath(page, "/en/dashboard/rides");
    await showUpcoming(page);
    const ride = card(page, "qaedit01");
    await ride.scrollIntoViewIfNeeded();
    await ride.getByRole("button", { name: "View Details" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "Edit Lane" });
    await dialog.getByRole("button", { name: "Edit ride" }).click();
    await page.locator("#edit-notes").fill("Gate 4");
    const refreshed = page.waitForResponse(
      (response) => response.request().method() === "GET" && /\/api\/bookings(\?|$)/.test(response.url()),
    );
    await page.getByRole("button", { name: "Save ride" }).click();
    expect((await refreshed).ok()).toBeTruthy();
    await expect(page.getByText("Ride updated")).toBeVisible();
    await expect(dialog.getByText("Edited")).toBeVisible();
    await shot(page, "admin-activity");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await ride.getByRole("button", { name: "View Details" }).click();
    await expect(page.getByRole("dialog").getByText("Gate 4")).toBeVisible();
    await page.keyboard.press("Escape");
    await ride.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Confirm Cancellation" }).click();
    await shot(page, "admin-cancel");
  });

  await step(page, results, "admin-quote-pay-link", async () => {
    await gotoPath(page, "/en/dashboard/rides");
    await page.getByRole("tab", { name: "Requests" }).click();
    await page.getByRole("button", { name: "Review request" }).first().click();
    await page.getByRole("button", { name: "Confirm & send pay link" }).click();
    const status = page.getByRole("status");
    await expect(status).toContainText("/pay/");
    payUrl = (await status.innerText()).match(/https?:\/\/\S+/)?.[0] ?? "";
    expect(payUrl).toContain("/pay/");
    await shot(page, "admin-quote-link");
    await gotoPath(page, payUrl);
    await expect(page.getByText("Pay to confirm")).toBeVisible();
    await shot(page, "customer-pay-link");
  });

  await step(page, results, "partner-invalid-phone", async () => {
    await gotoPath(page, "/en/partners/register");
    await page.locator("#name").fill("New Partner");
    await page.locator("#email").fill("new.partner@qa.example");
    await page.locator("#phone").fill("123");
    await page.locator("#password").fill("qa-password");
    await page.locator("#confirmPassword").fill("qa-password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("country code")).toBeVisible();
    await shot(page, "partner-invalid-phone");
    await page.locator("#phone").fill("+14155550199");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: "Account created" })).toBeVisible();
    await shot(page, "partner-registered");
  });

  await step(page, results, "partner-approval-and-vehicle", async () => {
    await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
    await gotoPath(page, "/en/dashboard/partners");
    await page.getByRole("tab", { name: "Applications" }).click();
    await page.getByRole("button", { name: /New Partner/ }).click();
    const sheet = page.locator("[data-slot=sheet-content]");
    const approve = sheet.getByRole("button", { name: "Approve Partner" });
    await expect(approve).toBeInViewport();
    await approve.click();
    await expect(approve).toBeHidden();
    await shot(page, "admin-approve-partner");
    await page.keyboard.press("Escape");
    await signIn(page, "/en/partners/login", ALPINE.email, ALPINE.password);
    await gotoPath(page, "/en/partners/fleet");
    await page.getByRole("button", { name: "Request Fleet" }).nth(1).click();
    const requested = page.waitForResponse(
      (response) => response.url().includes("/api/partners/fleet/request") && response.request().method() === "POST",
    );
    await page.getByRole("dialog").getByRole("button", { name: "Request Fleet" }).click();
    expect((await requested).ok()).toBeTruthy();
    await shot(page, "partner-vehicle-request");
    await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
    await gotoPath(page, "/en/dashboard/partners");
    await page.getByRole("tab", { name: "Active" }).click();
    await page.getByText("Alpine Transfers").first().click();
    const fleetSheet = page.locator("[data-slot=sheet-content]");
    await fleetSheet.getByRole("button", { name: "Fleet" }).click();
    await fleetSheet.getByRole("button", { name: "Approve Fleet Request" }).click();
    await shot(page, "admin-approve-vehicle");
  });

  await step(page, results, "partner-claim-race", async () => {
    const first = await browser.newContext();
    const second = await browser.newContext();
    const a = await first.newPage();
    const b = await second.newPage();
    await signIn(a, "/en/partners/login", ALPINE.email, ALPINE.password);
    await signIn(b, "/en/partners/login", LAKE.email, LAKE.password);
    await gotoPath(a, "/en/partners/dashboard");
    await gotoPath(b, "/en/partners/dashboard");
    await expect(a.getByText("Sion Market")).toBeVisible();
    await shot(a, "partner-available");
    const accept = (target: Page) =>
      target.locator(".desk-card").filter({ hasText: "Sion Market" }).getByRole("button", { name: "Accept Ride" }).click();
    const [firstResponse, secondResponse] = await Promise.all([
      a.waitForResponse((response) => response.url().includes("/accept") && response.request().method() === "POST"),
      b.waitForResponse((response) => response.url().includes("/accept") && response.request().method() === "POST"),
      accept(a),
      accept(b),
    ]);
    const statuses = [firstResponse.status(), secondResponse.status()].sort();
    expect(statuses, `claim statuses ${statuses.join(",")}`).toEqual([200, 409]);
    await gotoPath(a, "/en/partners/rides");
    await gotoPath(b, "/en/partners/rides");
    await expect.poll(async () => (await a.getByText("qaclaim1").count()) + (await b.getByText("qaclaim1").count())).toBeGreaterThan(0);
    const aWon = await a.getByText("qaclaim1").count();
    const bWon = await b.getByText("qaclaim1").count();
    expect(aWon === 0 || bWon === 0).toBeTruthy();
    await shot(a, "partner-claim-a");
    await shot(b, "partner-claim-b");
    await first.close();
    await second.close();
  });

  await step(page, results, "partner-complete-billing-settlement-clawback", async () => {
    await signIn(page, "/en/partners/login", ALPINE.email, ALPINE.password);
    await gotoPath(page, "/en/partners/billing");
    await expect(page.getByText("€55.00").first()).toBeVisible();
    await expect(page.getByText("The operator owes you this amount.")).toBeVisible();
    await shot(page, "partner-billing-before");
    const pdf = await page.request.get("/api/partners/statement?month=2024-01");
    expect(pdf.ok()).toBeTruthy();
    expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
    await gotoPath(page, "/en/partners/rides");
    const cash = page.locator(".desk-card").filter({ hasText: "Cash Margin Stop" });
    const completed = page.waitForResponse((response) => response.url().includes("/complete") && response.request().method() === "POST");
    await cash.getByRole("button", { name: "Mark completed" }).click();
    const completedResponse = await completed;
    expect(completedResponse.ok(), `complete ${completedResponse.status()}`).toBeTruthy();
    await gotoPath(page, "/en/partners/billing");
    await expect(page.getByText("€45.00").first()).toBeVisible();
    await expect(page.getByText(/[-−]€10\.00|€[-−]10\.00/)).toBeVisible();
    await shot(page, "partner-billing-after-cash");
    await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
    await gotoPath(page, "/en/dashboard/partners");
    await page.getByRole("tab", { name: "Active" }).click();
    await page.getByText("Alpine Transfers").first().click();
    const sheet = page.locator("[data-slot=sheet-content]");
    await sheet.getByRole("button", { name: "Billing" }).click();
    await sheet.getByRole("button", { name: "Record settlement" }).click();
    const settle = page.getByRole("dialog").filter({ has: page.locator("#settle-amount") });
    await settle.locator("#settle-amount").fill("10");
    await settle.locator("#settle-direction").selectOption("pay_partner");
    await settle.getByRole("button", { name: "Save settlement" }).click();
    await expect(sheet.getByText("€35.00").first()).toBeVisible();
    await shot(page, "admin-partial-settlement");
    await page.keyboard.press("Escape");
    await gotoPath(page, "/en/dashboard/rides");
    await page.getByRole("tab", { name: "Completed" }).click();
    const claw = card(page, "qaclaw01");
    await claw.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Confirm Cancellation" }).click();
    await signIn(page, "/en/partners/login", ALPINE.email, ALPINE.password);
    await gotoPath(page, "/en/partners/billing");
    await expect(page.getByText("Clawback")).toBeVisible();
    await expect(page.getByText("€20.00").first()).toBeVisible();
    await shot(page, "partner-billing-after-clawback");
  });

  await step(page, results, "driver-register-and-rides", async () => {
    await gotoPath(page, "/en/drivers/register");
    await page.locator("#name").fill("New Driver");
    await page.locator("#email").fill("new.driver@qa.example");
    await page.locator("#phone").fill("123");
    await page.locator("#password").fill("qa-password");
    await page.locator("#confirmPassword").fill("qa-password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("country code")).toBeVisible();
    await page.locator("#phone").fill("+14155550299");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: "Account created" })).toBeVisible();
    await shot(page, "driver-registered");
    await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
    await gotoPath(page, "/en/dashboard/drivers");
    await page.getByText("New Driver").click();
    await page.getByRole("button", { name: "Approve" }).click();
    await shot(page, "admin-approve-driver");
    await signIn(page, "/en/drivers/login", NIA.email, NIA.password);
    await gotoPath(page, "/en/drivers/dashboard");
    const ride = page.locator(".desk-card").filter({ hasText: "Lugano Station" });
    await expect(ride.getByRole("link", { name: "Open navigation" })).toHaveAttribute("href", /maps/);
    await expect(ride.getByRole("link", { name: "Apple Maps" })).toHaveAttribute("href", /apple/);
    await expect(ride.getByRole("link", { name: "Call" })).toHaveAttribute("href", /^tel:/);
    await ride.getByRole("button", { name: "Started" }).click();
    await ride.getByRole("button", { name: "Completed" }).click();
    const noshow = page.locator(".desk-card").filter({ hasText: "No Show Gate" });
    await noshow.getByRole("button", { name: "No-show" }).click();
    await shot(page, "driver-ride-actions");
    await page.locator("#time-off-start").fill("2026-12-21T00:00");
    await page.locator("#time-off-end").fill("2026-12-22T00:00");
    await page.locator("#time-off-note").fill("Holiday");
    await page.getByRole("button", { name: "Block these hours" }).click();
    await expect(page.getByRole("status")).toContainText("Time off saved");
    await shot(page, "driver-time-off");
  });

  await step(page, results, "driver-time-off-blocks-assignment", async () => {
    await signIn(page, "/en/drivers/login", "driver.two@qa.example", "qa-password");
    await gotoPath(page, "/en/drivers/dashboard");
    await page.locator("#time-off-start").fill("2026-12-21T00:00");
    await page.locator("#time-off-end").fill("2026-12-22T00:00");
    await page.getByRole("button", { name: "Block these hours" }).click();
    await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
    await gotoPath(page, "/en/dashboard/rides");
    await showUpcoming(page);
    const ride = card(page, "qatimeof");
    await ride.getByRole("button", { name: "Assign" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: /Omar Driver/ }).click();
    await dialog.getByRole("button", { name: "Assign" }).click();
    await expect(page.getByRole("status")).toContainText("time off");
    await shot(page, "admin-time-off-block");
  });

  await step(page, results, "calendar-feeds", async () => {
    await gotoPath(page, "/en/dashboard/calendar");
    await showCalendar(page, "Month");
    await showCalendar(page, "Week");
    await showCalendar(page, "Day");
    await shot(page, "admin-calendar-desktop");
    await page.getByRole("button", { name: "Create private feed" }).click();
    const adminLink = page.locator("a[href*='/api/calendar/']");
    await expect(adminLink).toBeVisible();
    const adminHref = (await adminLink.getAttribute("href")) ?? "";
    const adminBody = await (await page.request.get(adminHref)).text();
    expect(adminBody).toContain("BEGIN:VCALENDAR");
    expect(adminBody).toContain("qatoday1");
    await page.getByRole("button", { name: "Revoke feed" }).click();
    await expect(page.getByText("Feed revoked")).toBeVisible();
    expect((await page.request.get(adminHref)).status()).toBe(404);
    await signIn(page, "/en/drivers/login", NIA.email, NIA.password);
    await gotoPath(page, "/en/drivers/calendar");
    await page.getByRole("button", { name: "Create private feed" }).click();
    const driverHref = (await page.locator("a[href*='/api/calendar/']").getAttribute("href")) ?? "";
    const driverBody = await (await page.request.get(driverHref)).text();
    expect(driverBody).toContain("qadrvgo1");
    expect(driverBody).not.toContain("qaclaim1");
    expect(driverBody).not.toContain("+14155552671");
    await shot(page, "driver-calendar-desktop");
    await signIn(page, "/en/partners/login", ALPINE.email, ALPINE.password);
    await gotoPath(page, "/en/partners/calendar");
    await page.getByRole("button", { name: "Create private feed" }).click();
    await shot(page, "partner-calendar-desktop");
  });

  await step(page, results, "whatsapp-and-cron", async () => {
    await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
    await gotoPath(page, "/en/dashboard/settings/whatsapp");
    await expect(page.getByText("Assignee messages")).toBeVisible();
    await shot(page, "whatsapp-toggles");
    const outbox = await page.request.get("/api/qa/whatsapp");
    expect(outbox.ok()).toBeTruthy();
    const messages = ((await outbox.json()) as { messages: { text: string }[] }).messages.map((row) => row.text);
    expect(messages.some((text) => text.includes("assigned"))).toBeTruthy();
    expect(messages.some((text) => text.includes("was changed") || text.includes("available"))).toBeTruthy();
    const denied = await page.request.get("/api/cron");
    expect(denied.status()).toBe(401);
    const allowed = await page.request.get("/api/cron", {
      headers: { authorization: "Bearer qa-cron-secret" },
    });
    expect(allowed.ok()).toBeTruthy();
    const after = ((await (await page.request.get("/api/qa/whatsapp")).json()) as { messages: { text: string }[] }).messages;
    expect(after.some((row) => row.text.includes("Pickup reminder"))).toBeTruthy();
    await shot(page, "whatsapp-after-cron");
  });

  await step(page, results, "migrations", async () => {
    const uri = readFileSync("/tmp/qa-mongo-uri.txt", "utf8").trim();
    const run = (script: string, dry: boolean) =>
      execFileSync(
        "npx",
        ["--yes", "vite-node", "-c", "vitest.config.ts", script, ...(dry ? ["--", "--dry-run"] : [])],
        {
          cwd: "/workspace",
          env: { ...process.env, MONGODB_URI: uri },
          encoding: "utf8",
          timeout: 120_000,
        },
      );
    const balanceDry = run("scripts/migrate-partner-balance.ts", true);
    const accessDry = run("scripts/migrate-partner-access.ts", true);
    expect(balanceDry).toContain("would-write");
    expect(accessDry).toContain("Legacy Coach");
    expect(accessDry).toContain("would-write");
    run("scripts/migrate-partner-balance.ts", false);
    run("scripts/migrate-partner-access.ts", false);
    const balanceAgain = run("scripts/migrate-partner-balance.ts", false);
    const accessAgain = run("scripts/migrate-partner-access.ts", false);
    expect(balanceAgain).not.toContain("would-write");
    expect(balanceAgain).not.toContain('"action": "wrote"');
    expect(accessAgain).not.toContain('"action": "wrote"');
  });

  await portalShots(browser, results);
  writeReport(results);
  const failed = results.filter((row) => !row.pass);
  expect(failed, JSON.stringify(failed, null, 2)).toEqual([]);
});
