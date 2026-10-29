import { createHmac } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SECRET = process.env.NEXTAUTH_SECRET || "e2e-secret-not-for-production";

function signToken(email: string) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const body = Buffer.from(`${email.trim().toLowerCase()}|${exp}`).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

async function go(page: any, path: string) {
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

test("account portal tabs, cancel fee, change price, completed ride", async ({ page }) => {
  test.setTimeout(120_000);

  const token = signToken("ada@example.com");
  await go(page, `/en/account?token=${token}`);
  await expect(page.getByRole("heading", { name: "Your trips" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Upcoming" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Past" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Cancelled" })).toBeVisible();

  // Cancel fee preview shown
  await page.getByRole("button", { name: "Details" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText(/Cancellation fee/)).toBeVisible();
  await page.getByRole("button", { name: "Close" }).first().click();

  // Change shows new price
  await page.getByRole("button", { name: "Details" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Change" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(/New price/)).toBeVisible();

  // Completed ride has no actions
  const token2 = signToken("grace@example.com");
  await go(page, `/en/account?token=${token2}`);
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