import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

/**
 * Partners / Drivers side-drawer layout matrix.
 *
 * Run with `DRAWER_PHASE=before` before touching app code, then again without
 * it after the fixes. Screenshots land in /workspace/shots and the machine
 * readable result table in /workspace/shots/qa/drawer-summary.json.
 */

// This spec creates one browser context per viewport (48+), all in one test.
// Playwright's context tracing chokes while copying that many recordings, so
// screenshots plus the JSON summary are the evidence here.
test.use({ trace: "off" });

const SHOTS = "/workspace/shots";
const QA_DIR = join(SHOTS, "qa");
const BASE_URL = "http://127.0.0.1:3000";
const ADMIN = { email: "admin@e2e.example", password: "e2e-password" };
const PHASE = process.env.DRAWER_PHASE === "before" ? "before" : "after";

const WIDTHS = [320, 360, 390, 412, 430, 768, 1024, 1280, 1440, 1920] as const;
const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];
type Locale = "en" | "ar";

const PAGES = [
  { key: "partners", path: "dashboard/partners", readySelector: "main [data-partner-row]" },
  { key: "drivers", path: "dashboard/drivers", readySelector: 'main [data-slot="card"] button' },
] as const;
type PageKey = (typeof PAGES)[number]["key"];

type Cookies = Parameters<BrowserContext["addCookies"]>[0];
let authCookies: Cookies = [];

type Row = {
  page: PageKey;
  width: number;
  mode: string;
  locale: Locale;
  pass: boolean;
  violations: string[];
};

const rows: Row[] = [];

function writeSummary() {
  mkdirSync(QA_DIR, { recursive: true });
  writeFileSync(
    join(QA_DIR, "drawer-summary.json"),
    `${JSON.stringify({ phase: PHASE, rows }, null, 2)}\n`,
  );
}

function fileName(page: PageKey, width: number, mode: string) {
  return `drawer-${PHASE}-${page}-${width}-${mode}.png`;
}

async function signIn(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  await page.goto("/en/dashboard/signin", {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });
  await page.locator("#email").fill(ADMIN.email);
  await page.locator("#password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("signin"), {
    timeout: 120_000,
  });
  authCookies = await context.cookies();
  await context.close();
}

async function openBrowser(
  browser: Browser,
  width: number,
  height: number,
  mobile: boolean,
  mode: Mode,
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: mobile ? 2 : 1,
    colorScheme: mode,
    locale: "en-US",
  });
  await context.addCookies(authCookies);
  await context.addInitScript((value: string) => {
    try {
      localStorage.setItem("riviera-theme", value);
    } catch {
      // Storage disabled: the page falls back to light.
    }
  }, mode);
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(180_000);
  return { context, page };
}

/**
 * Opens the first record's drawer and returns the element that opened it, so
 * the focus-return assertion can compare against the real trigger.
 */
async function openFirstDrawer(
  page: Page,
  target: (typeof PAGES)[number],
  locale: Locale,
): Promise<string> {
  await page.goto(`/${locale}/${target.path}`, {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });
  await page.locator(target.readySelector).first().waitFor({
    state: "visible",
    timeout: 90_000,
  });

  const trigger =
    target.key === "partners"
      ? page.locator("main [data-partner-row]").first()
      : page.locator('main [data-slot="card"] button').first();

  // The baseline has records that overflow horizontally, which makes a normal
  // click wait for actionability forever. Fall back to a DOM click so the
  // "before" phase still captures the broken drawer; the fixed build clicks
  // normally and fails the case if it cannot.
  await trigger.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => undefined);
  await trigger.focus();
  try {
    await trigger.click({ timeout: 5_000 });
  } catch {
    await trigger.evaluate((el) => (el as HTMLElement).click());
  }

  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(450);

  // The Next.js dev overlay is a shadow-DOM portal, not app UI; it also steals
  // a Tab stop. Remove it before keyboard assertions.
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((portal) => portal.remove());
  });

  return trigger.evaluate((el) => {
    const id = el.getAttribute("data-drawer-trigger-id");
    if (id) return id;
    const generated = `drawer-trigger-${Math.random().toString(36).slice(2)}`;
    el.setAttribute("data-drawer-trigger-id", generated);
    return generated;
  });
}

type AuditArgs = { viewportWidth: number };

async function auditDrawer(page: Page, width: number): Promise<string[]> {
  const args: AuditArgs = { viewportWidth: width };

  return page.evaluate(({ viewportWidth }: AuditArgs) => {
    const issues: string[] = [];
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return ["drawer: no [role=dialog] is open"];

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isVisible = (el: Element) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const describe = (el: Element) => {
      const cls =
        typeof el.className === "string"
          ? el.className.trim().split(/\s+/).slice(0, 2).join(".")
          : "";
      const text = (
        el.getAttribute("aria-label") ||
        el.textContent ||
        el.getAttribute("placeholder") ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 48);
      return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""} "${text}"`;
    };

    // Page-level horizontal overflow.
    const doc = document.documentElement;
    if (doc.scrollWidth > vw + 1) {
      issues.push(`page-overflow: ${doc.scrollWidth} > viewport ${vw}`);
    }

    // Sheet geometry.
    const dialogRect = dialog.getBoundingClientRect();
    if (viewportWidth < 768) {
      if (Math.abs(dialogRect.width - vw) > 1.5) {
        issues.push(
          `drawer-width: ${Math.round(dialogRect.width)} != viewport ${vw} (<768 must be full width)`,
        );
      }
    } else if (dialogRect.width < 479 || dialogRect.width > 641) {
      issues.push(
        `drawer-width: ${Math.round(dialogRect.width)} outside 480-640 (>=768)`,
      );
    }

    // Find the scroll region: our data hook first, then the widest scrollable
    // descendant so the "before" phase can still measure the old markup.
    const findScrollable = (root: HTMLElement): HTMLElement | null => {
      const marked = root.querySelector<HTMLElement>("[data-drawer-body]");
      if (marked) return marked;
      let best: HTMLElement | null = null;
      let bestScroll = 0;
      for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
        const style = getComputedStyle(el);
        if (style.overflowY !== "auto" && style.overflowY !== "scroll") continue;
        const scroll = el.scrollHeight - el.clientHeight;
        if (scroll > bestScroll) {
          best = el;
          bestScroll = scroll;
        }
      }
      return best;
    };

    const body = findScrollable(dialog);
    if (!body) {
      issues.push("drawer-body: no scroll container found");
    } else {
      if (body.scrollWidth > body.clientWidth + 1) {
        issues.push(
          `drawer-overflow: body scrollWidth ${body.scrollWidth} > clientWidth ${body.clientWidth}`,
        );
      }
      body.scrollTop = body.scrollHeight;
    }

    const header =
      dialog.querySelector<HTMLElement>("[data-drawer-header]") ??
      (dialog.firstElementChild as HTMLElement | null);
    const footer = dialog.querySelector<HTMLElement>("[data-drawer-footer]");

    const inViewport = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return rect.height > 0 && rect.bottom > 0 && rect.top < vh;
    };

    if (!header) {
      issues.push("drawer-header: missing");
    } else if (!inViewport(header)) {
      issues.push(`drawer-header: not visible after body scroll (${describe(header)})`);
    }
    if (!footer) {
      issues.push("drawer-footer: missing data-drawer-footer");
    } else if (!inViewport(footer)) {
      issues.push(`drawer-footer: not visible after body scroll (${describe(footer)})`);
    }

    // Tap targets inside the drawer.
    const targets = dialog.querySelectorAll<HTMLElement>(
      "button, a, input, select, [role=radio], [role=tab], [role=switch]",
    );
    for (const el of Array.from(targets)) {
      if (!isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const inlineTextLink = el.tagName === "A" && style.display.startsWith("inline");
      const bigEnough = rect.width >= 44 && rect.height >= 44;
      const linkEnough = inlineTextLink && rect.width >= 44 && rect.height >= 24;
      if (!bigEnough && !linkEnough) {
        issues.push(
          `tap-target: ${Math.round(rect.width)}x${Math.round(rect.height)} ${describe(el)}`,
        );
      }
    }

    // Long text must wrap or truncate with a title. Flag leaf text that paints
    // outside its box without an ellipsis escape hatch.
    for (const el of Array.from(dialog.querySelectorAll<HTMLElement>("*"))) {
      if (!isVisible(el) || el.getAttribute("aria-hidden") === "true") continue;
      const leaf = Array.from(el.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 20,
      );
      if (!leaf) continue;
      if (el.scrollWidth <= el.clientWidth + 1) continue;
      const style = getComputedStyle(el);
      const truncated =
        style.textOverflow === "ellipsis" && Boolean(el.getAttribute("title"));
      if (!truncated) {
        issues.push(
          `long-text-overflow: ${el.scrollWidth}px > ${el.clientWidth}px in ${describe(el)}`,
        );
      }
    }

    return issues;
  }, args);
}

async function auditFocusTrap(page: Page): Promise<string[]> {
  const issues: string[] = [];
  for (let index = 0; index < 30; index += 1) {
    await page.keyboard.press("Tab");
    const state = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const active = document.activeElement;
      return {
        inDialog: Boolean(dialog && active && dialog.contains(active)),
        tag: active?.tagName.toLowerCase() ?? "none",
        label:
          (active as HTMLElement | null)?.getAttribute?.("aria-label") ??
          (active as HTMLElement | null)?.textContent?.trim().slice(0, 32) ??
          "",
      };
    });
    if (!state.inDialog) {
      issues.push(
        `focus-trap: Tab ${index + 1} left the dialog (${state.tag} "${state.label}")`,
      );
      break;
    }
  }
  return issues;
}

async function auditEscapeAndReturn(page: Page, triggerId: string): Promise<string[]> {
  const issues: string[] = [];
  await page.keyboard.press("Escape");
  const dialog = page.getByRole("dialog");
  try {
    await dialog.waitFor({ state: "hidden", timeout: 10_000 });
  } catch {
    issues.push("escape: dialog stayed open after Escape");
    return issues;
  }
  await page.waitForTimeout(150);
  const returned = await page.evaluate((id: string) => {
    const trigger = document.querySelector(`[data-drawer-trigger-id="${id}"]`);
    const active = document.activeElement;
    return {
      hasTrigger: Boolean(trigger),
      isTrigger: Boolean(trigger && active === trigger),
      contains: Boolean(trigger && active && trigger.contains(active)),
      tag: active?.tagName.toLowerCase() ?? "none",
    };
  }, triggerId);
  if (!returned.hasTrigger) {
    issues.push("escape: trigger element is gone, cannot verify focus return");
  } else if (!returned.isTrigger && !returned.contains) {
    issues.push(
      `escape: focus returned to ${returned.tag}, not the trigger (${triggerId})`,
    );
  }
  return issues;
}

async function runCase(
  browser: Browser,
  target: (typeof PAGES)[number],
  width: number,
  mode: Mode,
  modeToken: string,
  locale: Locale,
) {
  const mobile = width < 768;
  const height = mobile ? 844 : 900;
  const { context, page } = await openBrowser(browser, width, height, mobile, mode);
  const violations: string[] = [];

  try {
    const triggerId = await openFirstDrawer(page, target, locale);
    await page.screenshot({ path: join(SHOTS, fileName(target.key, width, modeToken)) });

    violations.push(...(await auditDrawer(page, width)));
    violations.push(...(await auditFocusTrap(page)));
    violations.push(...(await auditEscapeAndReturn(page, triggerId)));
  } catch (error) {
    violations.push(
      `exception: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`,
    );
  } finally {
    await context.close();
  }

  const row: Row = {
    page: target.key,
    width,
    mode: modeToken,
    locale,
    pass: violations.length === 0,
    violations,
  };
  rows.push(row);
  writeSummary();
  return row;
}

function failuresFor(target: PageKey, tokens: string[]): string[] {
  return rows
    .filter((row) => row.page === target && tokens.includes(row.mode) && !row.pass)
    .flatMap((row) =>
      row.violations.map(
        (violation) => `${target} ${row.width}px ${row.mode}: ${violation}`,
      ),
    );
}

test.beforeAll(async ({ browser }) => {
  mkdirSync(SHOTS, { recursive: true });
  mkdirSync(QA_DIR, { recursive: true });
  writeSummary();
  await signIn(browser);
});

for (const target of PAGES) {
  for (const mode of MODES) {
    test(`${target.key} ${mode} widths`, async ({ browser }) => {
      test.setTimeout(300_000);
      for (const width of WIDTHS) {
        await runCase(browser, target, width, mode, mode, "en");
      }
      expect(failuresFor(target.key, [mode])).toEqual([]);
    });
  }

  test(`${target.key} arabic rtl`, async ({ browser }) => {
    test.setTimeout(300_000);
    for (const mode of MODES) {
      for (const width of [390, 1280] as const) {
        await runCase(browser, target, width, mode, `${mode}-rtl`, "ar");
      }
    }
    expect(failuresFor(target.key, ["light-rtl", "dark-rtl"])).toEqual([]);
  });
}

test.afterAll(() => {
  writeSummary();
});
