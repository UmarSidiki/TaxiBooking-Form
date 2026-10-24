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

async function axeSerious(page: Page) {
  const result = await new AxeBuilder({ page })
    .exclude("nextjs-portal")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const bad = result.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
  expect(bad.map((item) => `${item.id}: ${item.help}`)).toEqual([]);
}

test("M7 pricing desk, quote, and axe", async ({ page, browser }) => {
  test.setTimeout(180_000);
  page.setDefaultTimeout(20_000);
  await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
  await gotoPath(page, "/en/dashboard/pricing");
  await expect(page.locator("main").getByRole("heading", { name: "Pricing" })).toBeVisible();
  await page.locator("#night-start").fill("22:00");
  await page.getByLabel("Night ends").fill("06:00");
  await page.getByLabel("Night percent").fill("10");
  await page.locator("#meet").fill("15");
  await page.locator("#minimum").fill("0");
  await page.getByLabel("Holiday date").fill("2026-12-25");
  await page.getByLabel("Holiday percent").fill("10");
  await page.getByRole("button", { name: "Add holiday" }).click();
  await page.getByRole("button", { name: "Save rules" }).click();
  await expect(page.getByRole("status").last()).toContainText("Saved");

  await page.getByLabel("From zone").fill("Geneva Airport");
  await page.getByLabel("To zone").fill("Lausanne");
  await page.getByLabel("Fixed price").fill("40");
  await page.getByRole("button", { name: "Save zone" }).click();
  await expect(page.getByRole("status").last()).toContainText("Saved");

  await page.getByLabel("Code").fill("SAVE10");
  await page.getByLabel("Amount").fill("10");
  await page.getByLabel("Total uses").fill("20");
  await page.getByLabel("Uses per customer").fill("2");
  await page.getByRole("button", { name: "Save promo" }).click();
  await expect(page.getByRole("status").last()).toContainText("Saved");
  await shot(page, "m7-pricing-desktop");
  await axeSerious(page);

  const vehicles = await page.request.get("/api/vehicles?isActive=true");
  expect(vehicles.ok()).toBeTruthy();
  const body = (await vehicles.json()) as { data: { _id: string }[] };
  const quote = await page.request.post("/api/quote", {
    data: {
      selectedVehicle: body.data[0]._id,
      bookingType: "destination",
      tripType: "oneway",
      pickup: "Geneva Airport",
      dropoff: "Lausanne Station",
      date: "2026-12-25",
      time: "23:00",
      childSeats: 1,
      meetAndGreet: true,
      promoCode: "SAVE10",
      distanceKm: 25.4,
    },
  });
  expect(quote.ok(), await quote.text()).toBeTruthy();
  const priced = (await quote.json()) as { total: number; lines: { code: string; amount: number }[] };
  expect(priced.lines.some((line) => line.code === "meet_greet" && line.amount === 15)).toBeTruthy();
  expect(priced.lines.some((line) => line.code === "promo" && line.amount < 0)).toBeTruthy();
  expect(priced.lines.some((line) => line.code === "night")).toBeTruthy();
  expect(priced.total).toBeGreaterThan(0);

  await gotoPath(page, "/en");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
  await page.getByPlaceholder("Enter destination address").fill("Lausanne Station");
  await page.locator('input[type="date"]').first().fill("2026-12-25");
  await page.locator('input[type="time"]').first().fill("23:00");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Select" }).first().click();
  await expect(page.getByLabel("Promo code")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Meet & greet" })).toBeVisible();
  await shot(page, "m7-wizard-extras-desktop");
  await axeSerious(page);

  await reviewPricing(browser);
});

async function reviewPricing(browser: Browser) {
  for (const view of VIEWS) {
    const context = await browser.newContext({
      viewport: view.viewport,
      isMobile: view.mobile,
      hasTouch: view.mobile,
      userAgent: "userAgent" in view ? view.userAgent : undefined,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
    await gotoPath(page, "/en/dashboard/pricing");
    await expect(page.locator("main").getByRole("heading", { name: "Pricing" })).toBeVisible();
    await shot(page, `m7-pricing-${view.name}`);
    await axeSerious(page);
    await context.close();
  }
}
