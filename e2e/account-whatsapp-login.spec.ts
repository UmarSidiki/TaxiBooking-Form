import { expect, test, type Page } from "@playwright/test";
import { seedVerifiedPhone } from "./helpers/verified-phone";

const QA_KEY = process.env.CRON_SECRET ?? "e2e-cron-secret";
const VERIFIED = { email: "nora@example.com", digits: "14155552671" };
let clientSeq = 0;

test.beforeEach(async ({ page }) => {
  clientSeq += 1;
  await page.context().setExtraHTTPHeaders({
    "x-forwarded-for": `198.51.100.${120 + clientSeq}`,
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

async function openWhatsAppForm(page: Page) {
  await go(page, "/en/account");
  await page.getByRole("button", { name: "Login via WhatsApp" }).click();
  await expect(page.getByRole("heading", { name: "Sign in with WhatsApp" })).toBeVisible();
}

async function latestWhatsAppCode(page: Page, digits: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await page.request.get("/api/qa/outbox", {
      headers: { "x-qa-key": QA_KEY },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    const body = (await response.json()) as {
      whatsapp?: { jid?: string; text?: string }[];
    };
    const message = (body.whatsapp ?? [])
      .filter((item) => item.jid === `${digits}@s.whatsapp.net`)
      .at(-1);
    const code = message?.text?.match(/\b\d{6}\b/)?.[0];
    if (code) return code;
    await page.waitForTimeout(250);
  }
  throw new Error(`No WhatsApp sign-in code reached the outbox for ${digits}`);
}

test("a verified WhatsApp number receives a code and opens the portal", async ({ page }) => {
  await seedVerifiedPhone(VERIFIED.email, VERIFIED.digits);
  await openWhatsAppForm(page);

  await page.locator("#account-whatsapp-calling-code").fill("1");
  await page.locator("#account-whatsapp-phone").fill("4155552671");
  await page.getByRole("button", { name: "Send code on WhatsApp" }).click();

  await expect(page.getByRole("heading", { name: "Check your WhatsApp" })).toBeVisible();
  const code = await latestWhatsAppCode(page, VERIFIED.digits);
  expect(code).toMatch(/^\d{6}$/);

  await page.locator("#account-code").pressSequentially(code);
  await page.getByRole("button", { name: "Verify and sign in" }).click();

  await expect(page).toHaveURL(/\/en\/account$/);
  await expect(page.getByText(VERIFIED.email)).toBeVisible();
  await expect(page.getByRole("button", { name: "Login via WhatsApp" })).toHaveCount(0);
});

test("an unknown number explains the fallback and returns to email", async ({ page }) => {
  await openWhatsAppForm(page);

  await page.locator("#account-whatsapp-calling-code").fill("1");
  await page.locator("#account-whatsapp-phone").fill("41555599999");
  await page.getByRole("button", { name: "Send code on WhatsApp" }).click();

  await expect(
    page.getByText(
      "We could not find a verified WhatsApp number. Sign in with your email instead.",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Sign in with your email instead" }).click();
  await expect(page.locator("#account-email")).toBeVisible();
});
