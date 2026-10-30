import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function go(page: Page, path: string) {
  for (let i = 0; i < 4; i += 1) {
    try {
      await go(page, path);
      return;
    } catch (error) {
      if (i === 3) throw error;
      await page.waitForTimeout(1500);
    }
  }
}

const SHOTS = "/workspace/shots";
const PAGES = [
  ["appearance", "/en/dashboard/settings/appearance"],
  ["rides", "/en/dashboard/rides"],
  ["today", "/en/dashboard/today"],
  ["gateways", "/en/dashboard/settings/gateways"],
  ["fleet", "/en/dashboard/fleet"],
  ["drivers", "/en/dashboard/drivers"],
  ["partners", "/en/dashboard/partners"],
] as const;

for (const scheme of ["light", "dark"] as const) {
  test(`riviera dashboard screenshots and axe (${scheme})`, async ({ page }, info) => {
    test.setTimeout(400_000);
    await page.emulateMedia({ colorScheme: scheme });
    const view = info.project.name === "desktop" ? "desktop" : "iphone";
    await go(page, "/en/dashboard/signin");
    await page.evaluate(() => localStorage.clear());
    await page.locator("#email").fill("admin@e2e.example");
    await page.locator("#password").fill("e2e-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => !url.pathname.includes("signin"), { timeout: 120_000 });
    const issues: string[] = [];
    for (const [name, path] of PAGES) {
      await go(page, path);
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${SHOTS}/dash-${view}-${scheme}-${name}.png` });
      const r = await new AxeBuilder({ page }).exclude("nextjs-portal").withTags(["wcag2a", "wcag2aa"]).analyze();
      for (const v of r.violations.filter((x) => x.impact === "serious" || x.impact === "critical")) {
        issues.push(`${name}: ${v.id} ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
      }
    }
    console.log(issues.length ? `[axe dash ${view}-${scheme}]\n${issues.join("\n")}` : `[axe dash ${view}-${scheme}] clean`);
    expect.soft(issues).toEqual([]);
  });
}
