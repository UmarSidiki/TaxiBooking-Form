import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { configureE2eDatabase, seedMagicLink } from "./helpers/login-token";

const EMAIL = "ada@example.com";
const SECTIONS = ["overview", "rides", "profile", "notifications", "security"] as const;
const WIDTHS = [320, 390, 768, 1440, 1920];
const SHOTS = process.env.SHOTS_DIR;
const CLIENT_BASE: Record<string, number> = { desktop: 110, pixel: 130, iphone: 150, webkit: 170 };
let clientSeq = 0;

test.beforeEach(async ({ page }, testInfo) => {
  clientSeq += 1;
  const octet = (CLIENT_BASE[testInfo.project.name] ?? 190) + clientSeq;
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${octet}` });
});

async function db() {
  configureE2eDatabase();
  const { connectDB } = await import("../src/shared/db");
  return (await connectDB()).connection.db!;
}

async function resetConsent() {
  const d = await db();
  await d.collection("customerprofiles").updateOne(
    { email: EMAIL },
    {
      $set: {
        email: EMAIL,
        verifiedPhone: "",
        "marketing.email": { status: "none", at: null, source: "", textVersion: "" },
        "marketing.whatsapp": { status: "none", at: null, source: "", textVersion: "" },
      },
    },
    { upsert: true },
  );
  await d.collection("marketingconsents").deleteMany({ emailLower: EMAIL });
  await d.collection("suppressions").deleteMany({});
}

async function signIn(page: Page, locale = "en") {
  for (let i = 0; i < 3; i += 1) {
    try {
      await page.goto(await seedMagicLink(EMAIL, locale), { waitUntil: "domcontentloaded" });
      break;
    } catch (error) {
      if (i === 2) throw error;
    }
  }
  await expect(page).toHaveURL(new RegExp(`/${locale}/account$`));
  await expect(page.locator('[data-account-section="overview"]').first()).toBeVisible();
}

function href(section: (typeof SECTIONS)[number], locale = "en") {
  return section === "overview" ? `/${locale}/account` : `/${locale}/account/${section}`;
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test("sub-pages navigate through the side nav or bottom tabs", async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  await resetConsent();
  await signIn(page);
  const nav = page.getByRole("navigation", { name: "Account" });
  await expect(nav).toHaveCount(1);
  await expect(nav).toBeVisible();

  for (const section of SECTIONS) {
    await nav.locator(`a[data-section="${section}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${href(section)}$`));
    await expect(page.locator(`[data-account-section="${section}"]`).first()).toBeVisible();
    await expect(nav.locator(`a[data-section="${section}"]`)).toHaveAttribute("aria-current", "page");
    await noHorizontalScroll(page);
    if (SHOTS) {
      const tag = testInfo.project.name === "desktop" ? "1440" : testInfo.project.name;
      if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1440, height: 900 });
      await page.screenshot({ path: `${SHOTS}/acctv3-${section}-${tag}.png`, fullPage: true });
      if (testInfo.project.name === "desktop") {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: `${SHOTS}/acctv3-${section}-390.png`, fullPage: true });
        await page.setViewportSize({ width: 1280, height: 800 });
      }
    }
  }

  const axe = await new AxeBuilder({ page })
    .exclude("nextjs-portal")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
});

test("marketing is opt-in; turning it off asks once and records consent", async ({ page }) => {
  test.setTimeout(120_000);
  await resetConsent();
  await signIn(page);
  await page.goto("/en/account/notifications", { waitUntil: "domcontentloaded" });

  const rideEmail = page.locator("#ride-updates").getByText("Always on");
  await expect(rideEmail).toBeVisible();
  await expect(page.getByRole("switch", { name: "WhatsApp", exact: true })).toHaveAttribute("aria-checked", "true");

  const emailOffers = page.getByRole("switch", { name: "Email offers and news" });
  const waOffers = page.getByRole("switch", { name: "WhatsApp offers" });
  await expect(emailOffers).toHaveAttribute("aria-checked", "false");
  await expect(waOffers).toHaveAttribute("aria-checked", "false");
  await expect(page.getByRole("heading", { name: "Rider offers" })).toBeVisible();

  await page.getByRole("button", { name: "Get offers by email" }).click();
  await expect(emailOffers).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText(/Subscribed since/)).toBeVisible();

  await emailOffers.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Seasonal offers and promo codes")).toBeVisible();
  await dialog.getByRole("button", { name: "Keep offers" }).click();
  await expect(dialog).toBeHidden();
  await expect(emailOffers).toHaveAttribute("aria-checked", "true");

  await emailOffers.click();
  await page.getByRole("dialog").getByRole("button", { name: "Turn off" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(emailOffers).toHaveAttribute("aria-checked", "false");

  const d = await db();
  const events = await d
    .collection("marketingconsents")
    .find({ emailLower: EMAIL, channel: "email" })
    .sort({ at: 1 })
    .toArray();
  expect(events.map((e) => [e.status, e.source])).toEqual([
    ["granted", "account"],
    ["withdrawn", "account"],
  ]);
  const profile = await d.collection("customerprofiles").findOne({ email: EMAIL });
  expect(profile?.marketing?.email?.status).toBe("withdrawn");
  await noHorizontalScroll(page);
});

test("RTL and all widths keep every sub-page inside the viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop" && testInfo.project.name !== "webkit", "width sweep on desktop engines");
  test.setTimeout(240_000);
  await signIn(page, "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const section of SECTIONS) {
      await page.goto(href(section, "ar"), { waitUntil: "domcontentloaded" });
      await expect(page.locator(`[data-account-section="${section}"]`).first()).toBeVisible();
      await noHorizontalScroll(page);
    }
    if (SHOTS && (width === 390 || width === 1440)) {
      await page.screenshot({ path: `${SHOTS}/acctv3-rtl-notifications-${width}-${testInfo.project.name}.png`, fullPage: true });
    }
  }
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const section of SECTIONS) {
      await page.goto(href(section), { waitUntil: "domcontentloaded" });
      await expect(page.locator(`[data-account-section="${section}"]`).first()).toBeVisible();
      await noHorizontalScroll(page);
    }
  }
});

test("unknown sub-page is a 404 and signed-out sub-page shows sign-in", async ({ page }) => {
  await page.goto("/en/account/nope");
  await expect(page.locator("[data-account-section]")).toHaveCount(0);
  await expect(page.locator("#account-email")).toHaveCount(0);
  await page.goto("/en/account/notifications");
  await expect(page.locator("#account-email")).toBeVisible();
});
