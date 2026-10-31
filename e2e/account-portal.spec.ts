import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { seedMagicLink } from "./helpers/login-token";

const QA_KEY = process.env.CRON_SECRET ?? "e2e-cron-secret";
const CLIENT_BASE: Record<string, number> = { desktop: 10, pixel: 30, iphone: 50 };
let clientSeq = 0;

test.beforeEach(async ({ page }, testInfo) => {
  clientSeq += 1;
  const octet = (CLIENT_BASE[testInfo.project.name] ?? 70) + clientSeq;
  await page.context().setExtraHTTPHeaders({
    "x-forwarded-for": `198.51.100.${octet}`,
  });
});

async function go(page: Page, path: string) {
  for (let i = 0; i < 4; i += 1) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      if (i === 3) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

async function magicLinkSignIn(page: Page, email: string) {
  await go(page, await seedMagicLink(email));
  await expect(page).toHaveURL(/\/en\/account$/);
  await expect(page.getByRole("heading", { name: "Your trips" })).toBeVisible();
}

async function latestSignInCode(page: Page, email: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await page.request.get("/api/qa/outbox", {
      headers: { "x-qa-key": QA_KEY },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    const body = (await response.json()) as {
      mail: { to?: string | string[]; text?: string }[];
      whatsapp?: { text?: string }[];
    };
    const mail = body.mail.filter((item) => {
      const to = Array.isArray(item.to) ? item.to : [item.to];
      return to.includes(email);
    });
    const code = (mail.at(-1)?.text ?? "").match(/\b\d{6}\b/)?.[0];
    if (code) return { code, whatsapp: body.whatsapp ?? [] };
    await page.waitForTimeout(250);
  }
  throw new Error(`Sign-in code for ${email} did not reach the mail outbox`);
}

test("email-only sign-in code reaches the inbox and opens the portal", async ({ page }) => {
  await go(page, "/en/account");
  await page.locator("#account-email").fill("ada@example.com");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.locator("#account-code")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Code sent.");

  const { code, whatsapp } = await latestSignInCode(page, "ada@example.com");
  expect(code).toMatch(/^\d{6}$/);
  expect(whatsapp.some((message) => message.text?.includes(code))).toBe(false);

  await page.locator("#account-code").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByRole("heading", { name: "Your trips" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Upcoming" })).toBeVisible();
});

test("magic link opens tabs, cancel fee, change price and completed ride", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const shot = (name: string) =>
    process.env.SHOTS_DIR
      ? page.screenshot({ path: `${process.env.SHOTS_DIR}/bf-portal-${name}-${testInfo.project.name}.png`, fullPage: true })
      : Promise.resolve();

  await magicLinkSignIn(page, "ada@example.com");
  await expect(page.getByRole("tab", { name: "Upcoming" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Past" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Cancelled" })).toBeVisible();
  await shot("list");

  // Cancel fee preview shown
  await page.getByRole("button", { name: "Details" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText(/Cancellation fee/)).toBeVisible();
  await shot("cancel");
  await page.getByRole("button", { name: "Close" }).first().click();

  // Change shows preview summary then confirms
  await page.getByRole("button", { name: "Details" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Change" }).click();
  await page.getByRole("button", { name: "Review change" }).click();
  await expect(page.getByText(/Current total/)).toBeVisible();
  await expect(page.getByText(/New total/)).toBeVisible();
  await expect(page.getByText(/Already paid/)).toBeVisible();
  await shot("change-review");
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  await page.getByRole("button", { name: "Confirm change" }).click();

  // Completed ride has no actions
  await magicLinkSignIn(page, "grace@example.com");
  await page.getByRole("tab", { name: "Past" }).click();
  await page.getByRole("button", { name: "Details" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Change" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancel" })).toHaveCount(0);

  // Axe check
  const result = await new AxeBuilder({ page })
    .exclude("nextjs-portal")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad).toEqual([]);
});
