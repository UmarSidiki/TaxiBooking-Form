import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { signInAdmin } from "./helpers/sign-in";

/**
 * Sidebar brand lockup: logo + name over subtitle inside one link, at mobile
 * (sheet), tablet and desktop widths in light and dark, plus Arabic RTL.
 * Screenshots land in /workspace/shots and are named
 * sidebar-after-<width>-<mode>.png (sidebar-after-ar-1440.png for Arabic).
 */

test.use({ trace: "off" });

const SHOTS = "/workspace/shots";
const BASE_URL = "http://127.0.0.1:3000";

const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];
const WIDTHS = [390, 768, 1440] as const;

type Cookies = Parameters<BrowserContext["addCookies"]>[0];
let authCookies: Cookies = [];

async function signIn(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  await signInAdmin(page);
  authCookies = await context.cookies();
  await context.close();
}

async function openSidebar(page: Page, width: number) {
  const link = page.locator("a.desk-brand");
  if (width >= 768) {
    await link.waitFor({ state: "visible", timeout: 90_000 });
    return link;
  }

  const trigger = page.locator('[data-sidebar="trigger"]:visible').first();
  const sheet = page.locator('[data-slot="sidebar"][data-mobile="true"]');
  await trigger.waitFor({ state: "visible", timeout: 90_000 });

  // The sidebar renders in desktop mode until useIsMobile's effect runs, so the
  // first tap can land while the trigger still toggles the desktop rail.
  await expect(async () => {
    if (await sheet.isVisible()) return;
    await trigger.click();
    await expect(sheet).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });

  await link.waitFor({ state: "visible", timeout: 60_000 });
  return link;
}

async function openDashboard(
  browser: Browser,
  width: number,
  mode: Mode,
  locale: "en" | "ar" = "en",
) {
  const mobile = width < 768;
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width, height: mobile ? 844 : 900 },
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
  await page.goto(`/${locale}/dashboard/home`, {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });

  return { context, page };
}

type Metrics = {
  hasName: boolean;
  hasSub: boolean;
  nameText: string;
  subText: string;
  title: string | null;
  linkHeight: number;
  nameBottom: number | null;
  subTop: number | null;
  logoWidth: number;
  logoHeight: number;
  logoCenter: number | null;
  textCenter: number | null;
  scrollWidth: number;
  viewport: number;
};

async function measure(link: ReturnType<Page["locator"]>): Promise<Metrics> {
  return link.evaluate((el) => {
    const anchor = el as HTMLElement;
    const name = anchor.querySelector<HTMLElement>(".desk-brand__name");
    const sub = anchor.querySelector<HTMLElement>(".desk-brand__sub");
    const logo = anchor.querySelector<HTMLElement>(".desk-brand__logo");
    const linkRect = anchor.getBoundingClientRect();
    const nameRect = name?.getBoundingClientRect();
    const subRect = sub?.getBoundingClientRect();
    const logoRect = logo?.getBoundingClientRect();

    return {
      hasName: Boolean(name && anchor.contains(name)),
      hasSub: Boolean(sub && anchor.contains(sub)),
      nameText: name?.textContent?.trim() ?? "",
      subText: sub?.textContent?.trim() ?? "",
      title: name?.getAttribute("title") ?? null,
      linkHeight: linkRect.height,
      nameBottom: nameRect?.bottom ?? null,
      subTop: subRect?.top ?? null,
      logoWidth: logoRect?.width ?? 0,
      logoHeight: logoRect?.height ?? 0,
      logoCenter: logoRect ? logoRect.top + logoRect.height / 2 : null,
      textCenter:
        nameRect && subRect ? (nameRect.top + subRect.bottom) / 2 : null,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    };
  });
}

async function assertLockup(link: ReturnType<Page["locator"]>) {
  const metrics = await measure(link);

  expect(metrics.hasName, "brand name is inside the link").toBe(true);
  expect(metrics.hasSub, "subtitle is inside the same link").toBe(true);
  expect(metrics.nameText.length).toBeGreaterThan(0);
  expect(metrics.subText.length).toBeGreaterThan(0);
  expect(metrics.title).toBe(metrics.nameText);

  expect(metrics.linkHeight).toBeGreaterThanOrEqual(44);

  expect(metrics.subTop).not.toBeNull();
  expect(metrics.nameBottom).not.toBeNull();
  const stackGap = (metrics.subTop ?? 0) - (metrics.nameBottom ?? 0);
  expect(stackGap, "subtitle sits right below the name").toBeGreaterThanOrEqual(-1);
  expect(stackGap, "subtitle sits right below the name").toBeLessThanOrEqual(4);

  expect(metrics.logoWidth).toBeGreaterThanOrEqual(28);
  expect(metrics.logoHeight).toBeGreaterThanOrEqual(28);
  expect(metrics.logoCenter).not.toBeNull();
  expect(metrics.textCenter).not.toBeNull();
  expect(
    Math.abs((metrics.logoCenter ?? 0) - (metrics.textCenter ?? 0)),
    "logo is vertically centred with the text block",
  ).toBeLessThanOrEqual(4);

  expect(metrics.scrollWidth, "no horizontal overflow").toBeLessThanOrEqual(
    metrics.viewport + 1,
  );

  return metrics;
}

async function screenshotHeader(page: Page, file: string) {
  mkdirSync(SHOTS, { recursive: true });
  const header = page.locator('[data-slot="sidebar-header"]:visible').first();
  await header.waitFor({ state: "visible", timeout: 30_000 });
  await header.screenshot({ path: join(SHOTS, file) });
}

test.beforeAll(async ({ browser }) => {
  mkdirSync(SHOTS, { recursive: true });
  await signIn(browser);
});

for (const mode of MODES) {
  for (const width of WIDTHS) {
    test(`brand lockup ${width}px ${mode}`, async ({ browser }) => {
      test.setTimeout(300_000);
      const { context, page } = await openDashboard(browser, width, mode);

      try {
        const link = await openSidebar(page, width);
        await assertLockup(link);
        await screenshotHeader(page, `sidebar-after-${width}-${mode}.png`);
      } finally {
        await context.close();
      }
    });
  }
}

test("brand lockup arabic rtl 1440px", async ({ browser }) => {
  test.setTimeout(300_000);
  const { context, page } = await openDashboard(browser, 1440, "light", "ar");

  try {
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const link = await openSidebar(page, 1440);
    await assertLockup(link);
    await screenshotHeader(page, "sidebar-after-ar-1440.png");
  } finally {
    await context.close();
  }
});

/* ------------------------------------------------------------------------ */
/* Uploaded logo: the plate grows with the image aspect ratio. Fixtures are
   generated PNGs (literal colours are fine here) so naturalWidth is real in
   both Chromium and WebKit.                                                */
/* ------------------------------------------------------------------------ */

type LogoKind = "wide" | "square" | "tall";

const LOGO_SIZES: Record<
  LogoKind,
  { width: number; height: number; rgb: readonly [number, number, number] }
> = {
  wide: { width: 400, height: 100, rgb: [37, 99, 235] },
  square: { width: 256, height: 256, rgb: [220, 38, 38] },
  tall: { width: 100, height: 300, rgb: [22, 163, 74] },
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function logoPng({ width, height, rgb }: (typeof LOGO_SIZES)[LogoKind]) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour RGB

  const stride = 1 + width * 3;
  const row = Buffer.alloc(stride);
  for (let x = 0; x < width; x += 1) {
    row[1 + x * 3] = rgb[0];
    row[1 + x * 3 + 1] = rgb[1];
    row[1 + x * 3 + 2] = rgb[2];
  }
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) row.copy(raw, y * stride);

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function logoDataUrl(kind: LogoKind) {
  return `data:image/png;base64,${logoPng(LOGO_SIZES[kind]).toString("base64")}`;
}

async function saveCompanyLogo(page: Page, url: string) {
  const response = await page.request.post("/api/settings", {
    data: { companyLogoUrl: url },
  });
  expect(
    response.ok(),
    `POST /api/settings companyLogoUrl -> ${response.status()}`,
  ).toBe(true);
}

type LogoMetrics = {
  complete: boolean;
  naturalWidth: number;
  naturalHeight: number;
  imgHeight: number;
  visibleWidth: number;
  imgLeft: number;
  imgRight: number;
  imgTop: number;
  imgBottom: number;
  plateLeft: number;
  plateRight: number;
  plateTop: number;
  plateBottom: number;
  plateCenter: number;
  textCenter: number;
  nameWidth: number;
  nameRight: number;
  nameText: string;
  nameOverflow: string;
  nameTextOverflow: string;
  subText: string;
  subHeight: number;
  lockupHeight: number;
  anchorRight: number;
  scrollWidth: number;
  viewport: number;
};

async function measureLogo(
  link: ReturnType<Page["locator"]>,
): Promise<LogoMetrics> {
  return link.evaluate((el) => {
    const anchor = el as HTMLElement;
    const plate = anchor.querySelector<HTMLElement>(".desk-brand__logo")!;
    const img = plate.querySelector<HTMLImageElement>("img")!;
    const name = anchor.querySelector<HTMLElement>(".desk-brand__name")!;
    const sub = anchor.querySelector<HTMLElement>(".desk-brand__sub")!;

    const anchorRect = anchor.getBoundingClientRect();
    const plateRect = plate.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    const nameRect = name.getBoundingClientRect();
    const subRect = sub.getBoundingClientRect();
    const nameStyle = getComputedStyle(name);
    const ratio = img.naturalWidth / Math.max(img.naturalHeight, 1);

    return {
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      imgHeight: imgRect.height,
      visibleWidth: Math.min(imgRect.width, imgRect.height * ratio),
      imgLeft: imgRect.left,
      imgRight: imgRect.right,
      imgTop: imgRect.top,
      imgBottom: imgRect.bottom,
      plateLeft: plateRect.left,
      plateRight: plateRect.right,
      plateTop: plateRect.top,
      plateBottom: plateRect.bottom,
      plateCenter: plateRect.top + plateRect.height / 2,
      textCenter: (nameRect.top + subRect.bottom) / 2,
      nameWidth: nameRect.width,
      nameRight: nameRect.right,
      nameText: name.textContent?.trim() ?? "",
      nameOverflow: nameStyle.overflow,
      nameTextOverflow: nameStyle.textOverflow,
      subText: sub.textContent?.trim() ?? "",
      subHeight: subRect.height,
      lockupHeight: anchorRect.height,
      anchorRight: anchorRect.right,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    };
  });
}

async function assertUploadedLogo(
  link: ReturnType<Page["locator"]>,
  kind: LogoKind,
) {
  const img = link.locator(".desk-brand__logo img");
  await expect(img).toHaveCount(1);
  await expect
    .poll(
      () =>
        img.evaluate((el) => {
          const image = el as HTMLImageElement;
          return image.complete && image.naturalWidth > 0;
        }),
      { timeout: 60_000 },
    )
    .toBe(true);

  if (kind === "wide") {
    await expect
      .poll(
        () =>
          img.evaluate(
            (el) => (el as HTMLImageElement).getBoundingClientRect().width,
          ),
        { timeout: 10_000 },
      )
      .toBeGreaterThanOrEqual(72);
  }

  const metrics = await measureLogo(link);

  expect(metrics.complete).toBe(true);
  expect(metrics.naturalWidth).toBeGreaterThan(0);
  expect(metrics.nameText.length).toBeGreaterThan(0);
  expect(metrics.subText.length).toBeGreaterThan(0);

  if (kind === "wide") {
    expect(
      metrics.visibleWidth,
      "a wide logo keeps a readable width",
    ).toBeGreaterThanOrEqual(72);
  } else {
    expect(
      metrics.imgHeight,
      "square and tall logos render at least 28px tall",
    ).toBeGreaterThanOrEqual(28);
  }

  expect(metrics.imgLeft, "image inside the plate (left)").toBeGreaterThanOrEqual(
    metrics.plateLeft - 0.5,
  );
  expect(metrics.imgRight, "image inside the plate (right)").toBeLessThanOrEqual(
    metrics.plateRight + 0.5,
  );
  expect(metrics.imgTop, "image inside the plate (top)").toBeGreaterThanOrEqual(
    metrics.plateTop - 0.5,
  );
  expect(
    metrics.imgBottom,
    "image inside the plate (bottom)",
  ).toBeLessThanOrEqual(metrics.plateBottom + 0.5);

  expect(
    Math.abs(metrics.plateCenter - metrics.textCenter),
    "plate is vertically centred with the text column",
  ).toBeLessThanOrEqual(4);

  expect(metrics.nameWidth, "brand name still visible").toBeGreaterThan(0);
  expect(metrics.nameOverflow).toBe("hidden");
  expect(metrics.nameTextOverflow).toBe("ellipsis");
  expect(
    metrics.nameRight,
    "brand name is not pushed out of the link",
  ).toBeLessThanOrEqual(metrics.anchorRight + 0.5);
  expect(metrics.subHeight, "subtitle still visible").toBeGreaterThan(0);

  expect(metrics.lockupHeight, "lockup stays compact").toBeLessThanOrEqual(56);
  expect(metrics.scrollWidth, "no horizontal overflow").toBeLessThanOrEqual(
    metrics.viewport + 1,
  );
}

test.describe("uploaded logo", () => {
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    await context.addCookies(authCookies);
    const page = await context.newPage();
    try {
      await saveCompanyLogo(page, "");
    } finally {
      await context.close();
    }
  });

  for (const kind of Object.keys(LOGO_SIZES) as LogoKind[]) {
    test(`${kind} logo fits the plate at every width and mode`, async ({
      browser,
    }) => {
      test.setTimeout(600_000);
      const url = logoDataUrl(kind);

      for (const mode of MODES) {
        for (const width of WIDTHS) {
          const { context, page } = await openDashboard(browser, width, mode);
          try {
            await saveCompanyLogo(page, url);
            await page.reload({
              waitUntil: "domcontentloaded",
              timeout: 180_000,
            });
            const link = await openSidebar(page, width);
            await expect(link.locator(".desk-brand__logo img")).toHaveAttribute(
              "src",
              url,
            );
            await assertUploadedLogo(link, kind);
            await screenshotHeader(
              page,
              `sidebar-logo-${kind}-${width}-${mode}.png`,
            );
          } finally {
            await context.close();
          }
        }
      }
    });
  }
});
