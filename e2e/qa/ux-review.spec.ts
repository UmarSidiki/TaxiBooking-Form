import { mkdirSync, writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { ADMIN, ALPINE, gotoPath, NIA, shot, signIn } from "./support";

type AxeHit = { id: string; impact: string | null; help: string; nodes: number; sample: string };
type TargetHit = { name: string; w: number; h: number };
type PageReport = { view: string; path: string; axe: AxeHit[]; smallTargets: TargetHit[] };

const ALL_VIEWS = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, mobile: false },
  {
    name: "pixel",
    viewport: { width: 412, height: 915 },
    mobile: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
  },
  {
    name: "iphone",
    viewport: { width: 390, height: 844 },
    mobile: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
  },
] as const;

const VIEWS = process.env.UX_DESKTOP === "1" ? ALL_VIEWS.filter((view) => view.name === "desktop") : ALL_VIEWS;

const PUBLIC_PATHS = [
  "/en",
  "/en/embeddable/v1",
  "/en/embeddable/v2",
  "/en/embeddable/v3",
  "/en/embeddable/v4",
  "/en/thank-you?tripId=QAUX&amount=60.80&method=cash",
  "/en/partners/login",
  "/en/partners/register",
  "/en/drivers/login",
  "/en/drivers/register",
];

const ADMIN_PATHS = [
  "/en/dashboard",
  "/en/dashboard/today",
  "/en/dashboard/rides",
  "/en/dashboard/calendar",
  "/en/dashboard/partners",
  "/en/dashboard/drivers",
  "/en/dashboard/settings/whatsapp",
  "/en/dashboard/settings/modules",
];

const PARTNER_PATHS = [
  "/en/partners/dashboard",
  "/en/partners/rides",
  "/en/partners/billing",
  "/en/partners/fleet",
  "/en/partners/calendar",
];

const DRIVER_PATHS = ["/en/drivers/dashboard", "/en/drivers/calendar"];

async function review(page: Page, view: string, path: string, mobile: boolean): Promise<PageReport> {
  await gotoPath(page, path);
  await page.waitForTimeout(400);
  const slug = `${view}-${path.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "")}`;
  await shot(page, `ux-${slug}`);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const smallTargets = mobile
    ? await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll("button, a, input, select, textarea, [role='tab']"));
        return nodes
          .map((node) => {
            const box = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            const name = (node.getAttribute("aria-label") || node.textContent || node.getAttribute("placeholder") || node.tagName)
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 60);
            return { name, w: Math.round(box.width), h: Math.round(box.height), display: style.display, visibility: style.visibility };
          })
          .filter((item) => item.display !== "none" && item.visibility !== "hidden" && item.w > 0 && item.h > 0 && item.h < 44 && item.w < 200)
          .map(({ name, w, h }) => ({ name, w, h }));
      })
    : [];
  return {
    view,
    path,
    axe: axe.violations.map((item) => ({
      id: item.id,
      impact: item.impact ?? null,
      help: item.help,
      nodes: item.nodes.length,
      sample: item.nodes.slice(0, 2).map((node) => `${node.target.join(" ")} :: ${node.html.slice(0, 180)}`).join(" || "),
    })),
    smallTargets,
  };
}

test("UX review with axe on desktop, Pixel 7, and iPhone 13", async ({ browser }) => {
  test.setTimeout(600_000);
  const reports: PageReport[] = [];
  for (const view of VIEWS) {
    const context: BrowserContext = await browser.newContext({
      viewport: view.viewport,
      userAgent: "userAgent" in view ? view.userAgent : undefined,
      isMobile: view.mobile,
      hasTouch: view.mobile,
      timezoneId: "UTC",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    page.setDefaultNavigationTimeout(60_000);
    const only = process.env.UX_PATHS?.split(",").filter(Boolean);
    const keep = (path: string) => !only || only.some((item) => path.startsWith(item));
    for (const path of PUBLIC_PATHS.filter(keep)) reports.push(await review(page, view.name, path, view.mobile));
    await signIn(page, "/en/dashboard/signin", ADMIN.email, ADMIN.password);
    for (const path of ADMIN_PATHS.filter(keep)) reports.push(await review(page, view.name, path, view.mobile));
    await signIn(page, "/en/partners/login", ALPINE.email, ALPINE.password);
    for (const path of PARTNER_PATHS.filter(keep)) reports.push(await review(page, view.name, path, view.mobile));
    await signIn(page, "/en/drivers/login", NIA.email, NIA.password);
    for (const path of DRIVER_PATHS.filter(keep)) reports.push(await review(page, view.name, path, view.mobile));
    await context.close();
  }
  mkdirSync("/opt/cursor/artifacts/qa", { recursive: true });
  const body = JSON.stringify(reports, null, 2);
  writeFileSync("/tmp/ux-report.json", body);
  writeFileSync("/opt/cursor/artifacts/qa/ux-report.json", body);
  const serious = reports.flatMap((page) =>
    page.axe.filter((hit) => hit.impact === "serious" || hit.impact === "critical").map((hit) => `${page.view} ${page.path} ${hit.id}`),
  );
  expect(serious, serious.join("\n")).toEqual([]);
});
