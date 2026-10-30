import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SHOTS = "/workspace/shots";

async function shootAndAudit(page: Page, file: string, issues: string[]) {
  await page.screenshot({ path: `${SHOTS}/${file}.png` });
  const result = await new AxeBuilder({ page })
    .exclude("nextjs-portal")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  for (const v of result.violations.filter((x) => x.impact === "serious" || x.impact === "critical")) {
    issues.push(`${file}: ${v.id} ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  }
}

for (const scheme of ["light", "dark"] as const) {
  test(`riviera form screenshots and axe (${scheme})`, async ({ page }, info) => {
    test.setTimeout(300_000);
    const issues: string[] = [];
    await page.emulateMedia({ colorScheme: scheme });
    const view = info.project.name === "desktop" ? "desktop" : "iphone";
    const name = `${view}-${scheme}`;
    await page.goto("/en", { waitUntil: "domcontentloaded", timeout: 180_000 });
    await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await shootAndAudit(page, `app-${name}-step1`, issues);
    await page.getByPlaceholder("Enter pickup address").fill("Geneva Airport");
    await page.getByPlaceholder("Enter destination address").fill("Lausanne Station");
    await page.locator('input[type="date"]').first().fill("2026-12-25");
    await page.locator('input[type="time"]').first().fill("12:00");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(3000);
    await shootAndAudit(page, `app-${name}-step2`, issues);
    await page.getByRole("button", { name: "Select" }).first().click();
    await expect(page.getByLabel("Promo code")).toBeVisible({ timeout: 30_000 });
    await shootAndAudit(page, `app-${name}-step3`, issues);
    if (scheme === "light" && view === "iphone") {
      await page.goto("/ar", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => sessionStorage.clear());
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2500);
      await shootAndAudit(page, "app-iphone-ar-step1", issues);
    }
    console.log(issues.length ? `[axe ${name}]\n${issues.join("\n")}` : `[axe ${name}] clean`);
    expect(issues).toEqual([]);
  });
}
