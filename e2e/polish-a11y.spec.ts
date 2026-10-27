import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SHOTS = "/workspace/shots";
const found: string[] = [];

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

async function axe(page: Page, label: string) {
  const result = await new AxeBuilder({ page })
    .exclude("nextjs-portal")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of bad) found.push(`${label}: ${v.id} (${v.impact}) ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
  console.log(`[axe] ${label}: ${bad.length} serious/critical, ${result.violations.length} total`);
}

test("polish: axe on pricing, fleet form, step 3", async ({ page }, info) => {
  test.setTimeout(300_000);
  const p = info.project.name;
  await go(page, "/en/dashboard/signin");
  await page.locator("#email").fill("admin@e2e.example");
  await page.locator("#password").fill("e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("signin"));

  await go(page, "/en/dashboard/pricing");
  await expect(page.getByRole("heading", { name: "Extras" })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole("tab", { name: /Fixed routes/ })).toHaveCount(0);
  await page.getByLabel("Start date").fill("2026-12-24");
  await page.getByLabel("End date").fill("2026-12-26");
  await page.getByLabel("Holiday percent").fill("10");
  await page.getByRole("heading", { name: "Holiday surcharges" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/polish-${p}-holidays.png` });
  const card = await page.getByRole("heading", { name: "Holiday surcharges" }).locator("xpath=ancestor::section[1]").boundingBox();
  const add = await page.getByRole("button", { name: "Add holiday" }).boundingBox();
  expect(card && add && add.x + add.width <= card.x + card.width - 12).toBeTruthy();
  await axe(page, `${p} pricing holidays`);
  await page.getByRole("heading", { name: "Extras" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/polish-${p}-extras.png` });
  await page.getByRole("tab", { name: /Promo codes/ }).click();
  await axe(page, `${p} pricing promos`);

  await go(page, "/en/dashboard/fleet");
  await page.getByRole("button", { name: /edit/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await axe(page, `${p} fleet form`);
  await page.getByRole("dialog").getByRole("button", { name: "Capacity" }).click();
  await page.screenshot({ path: `${SHOTS}/polish-${p}-fleet-form.png` });
  await axe(page, `${p} fleet form capacity`);

  await go(page, "/en");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  const pickup = page.getByPlaceholder("Enter pickup address");
  await expect(pickup).toHaveAttribute("inputmode", "text");
  expect(await pickup.evaluate((el) => getComputedStyle(el).fontSize)).toBe(p === "desktop" ? "14px" : "16px");
  await axe(page, `${p} step1`);
  await pickup.fill("Geneva Airport");
  await page.getByPlaceholder("Enter destination address").fill("Lausanne Station");
  await page.locator('input[type="date"]').first().fill("2026-12-25");
  await page.locator('input[type="time"]').first().fill("12:00");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Select" }).first().click();
  await expect(page.getByLabel("Promo code")).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `${SHOTS}/polish-${p}-step3.png`, fullPage: true });
  await axe(page, `${p} step3`);

  console.log(found.length ? `[axe] FOUND\n${found.join("\n")}` : "[axe] clean");
  expect(found).toEqual([]);
});
