import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN, gotoPath, shot, signIn } from "./support";

const VIEWS = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, mobile: false },
  {
    name: "pixel",
    viewport: { width: 412, height: 915 },
    mobile: true,
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
  },
  {
    name: "iphone",
    viewport: { width: 390, height: 844 },
    mobile: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
  },
] as const;

function payToken(tripId: string) {
  const body = Buffer.from(tripId).toString("base64url");
  const sig = createHmac("sha256", "qa-secret-not-for-production").update(`ride-pay:${body}`).digest("base64url");
  return `${body}.${sig}`;
}

async function axeOk(page: Page) {
  const result = await new AxeBuilder({ page }).exclude("nextjs-portal").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(result.violations.filter((item) => item.impact === "serious" || item.impact === "critical").map((item) => item.id)).toEqual([]);
}

async function hourlyWizard(page: Page, name: string) {
  await gotoPath(page, "/en");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Hourly" }).click();
  await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
  await page.locator('input[type="date"]').first().fill("2026-10-26");
  await page.locator('input[type="time"]').first().fill("23:00");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "Select" }).first()).toBeVisible();
  await shot(page, `hourly-vehicles-${name}`);
  await axeOk(page);
}

async function returnWizard(page: Page, name: string) {
  await page.evaluate(() => sessionStorage.clear());
  await gotoPath(page, "/en");
  await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
  await page.getByPlaceholder("Enter destination address").fill("Lausanne Station");
  await page.getByRole("button", { name: "Round Trip" }).click();
  await page.locator('input[type="date"]').nth(0).fill("2026-10-26");
  await page.locator('input[type="time"]').nth(0).fill("09:30");
  await page.locator('input[type="date"]').nth(1).fill("2026-10-27");
  await page.locator('input[type="time"]').nth(1).fill("18:00");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "Select" }).first()).toBeVisible();
  await shot(page, `return-vehicles-${name}`);
  await axeOk(page);
}

test("hourly and return rides through price, pay, invoice, calendar, and notices", async ({ page, browser }) => {
  test.setTimeout(240_000);
  page.setDefaultTimeout(20_000);
  await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
  await gotoPath(page, "/en/dashboard/pricing");
  await page.locator("#night-start").fill("22:00");
  await page.getByLabel("Night ends").fill("06:00");
  await page.getByLabel("Night percent").fill("10");
  await page.locator("#meet").fill("15");
  await page.locator("#minimum").fill("0");
  await page.locator("#deposit").fill("25");
  await page.getByRole("button", { name: "Save rules" }).click();
  await expect(page.getByRole("status").last()).toContainText("Saved");
  await page.getByLabel("Code").fill("SAVE10");
  await page.getByLabel("Amount").fill("10");
  await page.getByRole("button", { name: "Save promo" }).click();
  await expect(page.getByRole("status").last()).toContainText("Saved");
  await shot(page, "hourly-return-pricing-desktop");

  const vehicles = await page.request.get("/api/vehicles?isActive=true");
  const fleet = (await vehicles.json()) as { data: { _id: string; name: string }[] };
  const sedan = fleet.data.find((item) => item.name === "Sedan") ?? fleet.data[0];

  const hourly = await page.request.post("/api/quote", {
    data: {
      selectedVehicle: sedan._id,
      bookingType: "hourly",
      tripType: "oneway",
      duration: 1,
      pickup: "Geneva Airport",
      date: "2026-10-26",
      time: "23:00",
      meetAndGreet: true,
      promoCode: "SAVE10",
    },
  });
  expect(hourly.ok(), await hourly.text()).toBeTruthy();
  const hourlyBody = (await hourly.json()) as { total: number; chargeAmount: number; balanceDue: number; lines: { code: string }[] };
  expect(hourlyBody.total).toBe(74.25);
  expect(hourlyBody.chargeAmount).toBe(18.56);
  expect(hourlyBody.balanceDue).toBe(55.69);
  expect(hourlyBody.lines.map((line) => line.code)).toEqual(expect.arrayContaining(["meet_greet", "night", "promo"]));

  const round = await page.request.post("/api/quote", {
    data: {
      selectedVehicle: sedan._id,
      bookingType: "destination",
      tripType: "roundtrip",
      pickup: "Geneva Airport",
      dropoff: "Lausanne Station",
      date: "2026-10-26",
      time: "09:30",
      distanceKm: 25.4,
    },
  });
  expect(round.ok(), await round.text()).toBeTruthy();
  const roundBody = (await round.json()) as { total: number; chargeAmount: number; balanceDue: number };
  expect(roundBody.total).toBe(72);
  expect(roundBody.chargeAmount).toBe(18);
  expect(roundBody.balanceDue).toBe(54);

  const passenger = {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada.hourly@example.com",
    phone: "+14155552671",
    passengers: 1,
    companyWebsite: "",
    formStartedAt: Date.now() - 10_000,
    whatsappOptIn: true,
    paymentMethod: "cash",
    selectedVehicle: sedan._id,
    date: "2026-10-26",
    locale: "en",
  };
  const booked = await page.request.post("/api/booking", {
    data: { ...passenger, bookingType: "hourly", tripType: "oneway", duration: 1, pickup: "Geneva Airport", time: "23:00", meetAndGreet: true, promoCode: "SAVE10" },
  });
  expect(booked.ok(), await booked.text()).toBeTruthy();
  const bookedBody = (await booked.json()) as { tripId: string; totalAmount: number };
  expect(bookedBody.totalAmount).toBe(74.25);

  const returned = await page.request.post("/api/booking", {
    data: {
      ...passenger,
      email: "ada.return@example.com",
      bookingType: "destination",
      tripType: "roundtrip",
      pickup: "Geneva Airport",
      dropoff: "Lausanne Station",
      time: "09:30",
      returnDate: "2026-10-27",
      returnTime: "18:00",
    },
  });
  expect(returned.ok(), await returned.text()).toBeTruthy();
  const returnedBody = (await returned.json()) as { tripId: string; totalAmount: number };
  expect(returnedBody.totalAmount).toBe(72);

  const resent = await page.request.post(`/api/admin/invoices/${bookedBody.tripId}`);
  expect(resent.ok(), await resent.text()).toBeTruthy();
  const outbox = await page.request.get("/api/qa/outbox", { headers: { "x-qa-key": "qa-cron-secret" } });
  expect(outbox.ok(), await outbox.text()).toBeTruthy();
  const box = (await outbox.json()) as { mail: { attachments: { pdf: boolean; bytes: number }[] }[]; whatsapp: { pdf: boolean }[] };
  expect(box.mail.some((mail) => mail.attachments.some((file) => file.pdf && file.bytes > 20_000))).toBeTruthy();
  expect(box.whatsapp.some((item) => item.pdf)).toBeTruthy();

  await gotoPath(page, `/en/pay/ride/${payToken(bookedBody.tripId)}`);
  await expect(page.getByRole("heading", { name: "Pay to confirm" })).toBeVisible();
  await expect(page.getByText("Due now:")).toBeVisible();
  await expect(page.getByText("€18.56")).toBeVisible();
  await expect(page.getByText("Balance due:")).toBeVisible();
  await expect(page.getByText(/Pay the driver in cash/)).toBeVisible();
  await expect(page.getByText("QA Bank")).toBeVisible();
  await expect(page.getByText("CH9300762011623852957")).toBeVisible();
  await shot(page, "invoice-pay-desktop");
  await axeOk(page);

  const invoice = await page.request.get(`/api/invoice/${bookedBody.tripId}`);
  expect(invoice.ok()).toBeTruthy();
  const pdf = Buffer.from(await invoice.body());
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  expect(pdf.length).toBeGreaterThan(20_000);

  await gotoPath(page, "/en/dashboard/calendar");
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  await shot(page, "hourly-return-calendar-desktop");
  await gotoPath(page, "/en/dashboard/rides");
  await expect(page.getByText("Geneva Airport").first()).toBeVisible();
  await shot(page, "hourly-return-rides-desktop");

  await hourlyWizard(page, "desktop");
  await returnWizard(page, "desktop");
  const limits = execFileSync("node", ["scripts/qa-rate-limits.mjs"], { encoding: "utf8" });
  writeFileSync("/opt/cursor/artifacts/qa/rate-limits.json", limits);
  const parsed = JSON.parse(limits) as { evidence: { name: string; blocked: { status: number; retry: string | null } | null; normal: { status: number } }[] };
  for (const row of parsed.evidence) {
    expect(row.normal.status, row.name).not.toBe(429);
    expect(row.blocked?.status, row.name).toBe(429);
    expect(row.blocked?.retry, row.name).toBeTruthy();
  }
  await reviewMobile(browser, bookedBody.tripId);
});

async function reviewMobile(browser: Browser, tripId: string) {
  for (const view of VIEWS.filter((item) => item.mobile)) {
    const context = await browser.newContext({
      viewport: view.viewport,
      isMobile: true,
      hasTouch: true,
      userAgent: view.userAgent,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    await hourlyWizard(page, view.name);
    await returnWizard(page, view.name);
    await gotoPath(page, `/en/pay/ride/${payToken(tripId)}`);
    await expect(page.getByText("Due now:")).toBeVisible();
    await shot(page, `invoice-pay-${view.name}`);
    await axeOk(page);
    await context.close();
  }
}
