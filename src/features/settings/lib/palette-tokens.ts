/**
 * Palette token math shared by the preset generator (scripts/gen-riviera-palettes.ts),
 * the server-rendered custom palette and the admin editor preview.
 * Every value produced here is a normalised #RRGGBB or an rgb() built from numbers,
 * so nothing user-supplied ever reaches CSS verbatim.
 */

export const TOKEN_KEYS = [
  "paper", "sheet", "field", "well", "ink", "ink2", "rule", "rule2",
  "sig", "sig-on", "sig-tint", "link", "info", "ok", "warn", "err",
  "ok-tint", "warn-tint", "err-tint", "info-tint", "sidebar", "dock",
  "logo-plate", "logo-ink", "elev",
] as const;
export type TokenKey = (typeof TOKEN_KEYS)[number];
export type PaletteTokens = Record<TokenKey, string>;
export type PaletteSet = { light: PaletteTokens; dark: PaletteTokens };

const HEX = /^#[0-9a-fA-F]{6}$/;
export function isStrictHex(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

type Rgb = [number, number, number];
function toRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}
type Hsl = [number, number, number];
function toHsl(hex: string): Hsl {
  const [r, g, b] = toRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
export function hsl(h: number, s: number, l: number): string {
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Moves fg's lightness away from the backgrounds until it reaches `min` against all of them. */
export function ensureContrast(fg: string, bgs: string[], min: number): string {
  const ok = (c: string) => bgs.every((bg) => contrast(c, bg) >= min);
  if (ok(fg)) return fg.toUpperCase();
  const [h, s, l0] = toHsl(fg);
  const lightBg = bgs.reduce((sum, bg) => sum + luminance(bg), 0) / bgs.length > 0.18;
  for (let i = 1; i <= 100; i++) {
    const c = hsl(h, s, lightBg ? l0 - i * 0.01 : l0 + i * 0.01);
    if (ok(c)) return c;
  }
  return lightBg ? "#000000" : "#FFFFFF";
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgb(${r} ${g} ${b} / ${alpha.toFixed(2)})`;
}

const ELEV_LIGHT = "0 1px 2px rgb(16 24 40 / 0.06), 0 1px 3px rgb(16 24 40 / 0.05)";
const ELEV_DARK = "0 1px 2px rgb(0 0 0 / 0.45), 0 0 0 1px rgb(255 255 255 / 0.02)";

/** Fills the derived extras (dock, logo plate/ink, elevation) for a hand-tuned preset. */
export function completeTokens(
  light: Omit<PaletteTokens, "dock" | "logo-plate" | "logo-ink" | "elev">,
  dark: Omit<PaletteTokens, "dock" | "logo-plate" | "logo-ink" | "elev">,
  darkLogoPlate: string,
): PaletteSet {
  return {
    light: { ...light, dock: rgba(light.sheet, 0.74), "logo-plate": light.field, "logo-ink": light.ink, elev: ELEV_LIGHT },
    dark: { ...dark, dock: rgba(dark.sheet, 0.72), "logo-plate": darkLogoPlate, "logo-ink": light.ink, elev: ELEV_DARK },
  };
}

/** Tokens an operator may pin by hand in the custom palette (background, surfaces, text, border). */
export const OVERRIDE_KEYS = ["paper", "sheet", "field", "well", "ink", "ink2", "rule"] as const;
export type OverrideKey = (typeof OVERRIDE_KEYS)[number];
export type ModeOverrides = Partial<Record<OverrideKey, string>>;
export type PaletteOverrides = { light?: ModeOverrides; dark?: ModeOverrides };

/** Keeps only known keys with strict #RRGGBB values, upper-cased. */
export function cleanOverrides(value: unknown): ModeOverrides {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const out: ModeOverrides = {};
  for (const k of OVERRIDE_KEYS) {
    const hex = v[k];
    if (isStrictHex(hex)) out[k] = hex.toUpperCase();
  }
  return out;
}

export type DerivedPalette = PaletteSet & {
  /** Present when the picked colour had to move to reach WCAG AA. */
  adjusted: { brand?: { from: string; to: string; ratio: number }; accent?: { from: string; to: string; ratio: number } };
};

/** Builds a full light + dark token set from a brand (action) colour and an accent (link) colour. */
export function derivePalette(brandIn: string, accentIn: string, overrides: PaletteOverrides = {}): DerivedPalette {
  const lo = cleanOverrides(overrides.light);
  const dO = cleanOverrides(overrides.dark);
  const brand = (isStrictHex(brandIn) ? brandIn : "#171717").toUpperCase();
  const accent = (isStrictHex(accentIn) ? accentIn : "#1D4ED8").toUpperCase();
  const [h, s] = toHsl(brand);
  const ts = Math.min(s, 0.35);

  // Light: tinted page, slightly dimmed cards, white inputs.
  const L = {} as PaletteTokens;
  L.paper = lo.paper ?? hsl(h, ts * 0.4, 0.955);
  L.sheet = lo.sheet ?? hsl(h, ts * 0.35, 0.986);
  L.field = lo.field ?? "#FFFFFF";
  L.well = lo.well ?? hsl(h, ts * 0.4, 0.93);
  L.rule = lo.rule ?? hsl(h, ts * 0.3, 0.87);
  L.rule2 = ensureContrast(hsl(h, ts * 0.25, 0.56), [L.paper, L.sheet, L.field], 3);
  L.ink = lo.ink ?? ensureContrast(hsl(h, ts * 0.5, 0.12), [L.paper, L.sheet, L.well, L.field], 7);
  L.sig = ensureContrast(brand, ["#FFFFFF", L.paper, L.sheet], 4.5);
  L["sig-on"] = "#FFFFFF";
  const [sh, ss] = toHsl(L.sig);
  L["sig-tint"] = hsl(sh, Math.min(ss, 0.7), 0.95);
  L.ink2 = lo.ink2 ?? ensureContrast(hsl(h, ts * 0.3, 0.38), [L.paper, L.sheet, L.well, L.field, L["sig-tint"]], 4.5);
  L.link = ensureContrast(accent, [L.paper, L.sheet, L.well, L.field], 4.5);
  L.info = ensureContrast("#1D4ED8", [L.paper, L.sheet, L.field], 4.5);
  for (const [tone, base, tint] of [["ok", "#15803D", "#EEF8F1"], ["warn", "#A14A06", "#FDF4EA"], ["err", "#B91C1C", "#FDF0F0"], ["info-x", "", "#EFF4FD"]] as const) {
    if (tone === "info-x") { L["info-tint"] = tint; L.info = ensureContrast(L.info, [tint], 4.5); continue; }
    L[`${tone}-tint`] = tint;
    L[tone] = ensureContrast(base, [tint, L.paper, L.sheet, L.field], 4.5);
  }
  L.sidebar = L.sheet;
  L.dock = rgba(L.sheet, 0.74);
  L["logo-plate"] = L.field;
  L["logo-ink"] = L.ink;
  L.elev = ELEV_LIGHT;

  // Dark: deep tinted page, raised cards, recessed inputs.
  const D = {} as PaletteTokens;
  D.paper = dO.paper ?? hsl(h, ts * 0.45, 0.07);
  D.sheet = dO.sheet ?? hsl(h, ts * 0.4, 0.11);
  D.field = dO.field ?? hsl(h, ts * 0.45, 0.085);
  D.well = dO.well ?? hsl(h, ts * 0.4, 0.155);
  D.rule = dO.rule ?? hsl(h, ts * 0.3, 0.2);
  D.rule2 = ensureContrast(hsl(h, ts * 0.25, 0.45), [D.paper, D.sheet, D.field], 3);
  D.ink = dO.ink ?? ensureContrast(hsl(h, ts * 0.3, 0.93), [D.paper, D.sheet, D.well, D.field], 7);
  const [bh, bs, bl] = toHsl(brand);
  D.sig = ensureContrast(hsl(bh, Math.min(bs, 0.8), Math.max(bl, 0.68)), [D.paper, D.sheet], 4.5);
  D["sig-on"] = D.paper;
  D["sig-tint"] = hsl(bh, Math.min(bs, 0.4), 0.2);
  D.ink2 = dO.ink2 ?? ensureContrast(hsl(h, ts * 0.25, 0.68), [D.paper, D.sheet, D.well, D.field, D["sig-tint"]], 4.5);
  if (!dO.ink) D.ink = ensureContrast(D.ink, [D["sig-tint"]], 4.5);
  D.link = ensureContrast(accent, [D.paper, D.sheet, D.well, D.field], 4.5);
  for (const [tone, base, tint] of [["ok", "#5FD68E", "#14261B"], ["warn", "#F5B94A", "#2A2112"], ["err", "#F88A8A", "#2C1717"], ["info", "#7DB4FB", "#15203A"]] as const) {
    D[`${tone}-tint`] = tint;
    D[tone] = ensureContrast(base, [tint, D.paper, D.sheet, D.field], 4.5);
  }
  D.sidebar = D.sheet;
  D.dock = rgba(D.sheet, 0.72);
  D["logo-plate"] = hsl(h, ts * 0.3, 0.96);
  D["logo-ink"] = L.ink;
  D.elev = ELEV_DARK;

  const adjusted: DerivedPalette["adjusted"] = {};
  if (L.sig !== brand) adjusted.brand = { from: brand, to: L.sig, ratio: contrast(brand, "#FFFFFF") };
  if (L.link !== accent) adjusted.accent = { from: accent, to: L.link, ratio: contrast(accent, L.paper) };
  return { light: L, dark: D, adjusted };
}

/** CSS for one palette id. Keys are fixed, values come from this module only. */
export function paletteCss(id: string, set: PaletteSet, { isDefault = false } = {}): string {
  if (!/^[a-z]+$/.test(id)) throw new Error(`Bad palette id ${id}`);
  const lroot = isDefault ? ':root:not([data-riviera-theme="dark"])' : `:root[data-palette="${id}"]:not([data-riviera-theme="dark"])`;
  const droot = isDefault ? ':root[data-riviera-theme="dark"]' : `:root[data-palette="${id}"][data-riviera-theme="dark"]`;
  const sel = (root: string, mode: string) =>
    [root, `${root} .riviera`, `${root} .riviera-embed`, `${root} .riviera-drawer`, `:root${mode} .riviera [data-palette-scope="${id}"]`].join(",\n");
  const body = (t: PaletteTokens, light: boolean) =>
    TOKEN_KEYS.map((k) => `  --${k}: ${light && k === "sig" ? `var(--operator-accent, ${t[k]})` : t[k]};\n`).join("");
  return `${sel(lroot, ':not([data-riviera-theme="dark"])')} {\n${body(set.light, true)}}\n\n${sel(droot, '[data-riviera-theme="dark"]')} {\n${body(set.dark, false)}}\n`;
}

/** [foreground, background, minimum] pairs every palette must meet (WCAG 1.4.3 / 1.4.11). */
export const CONTRAST_PAIRS: Array<[TokenKey, TokenKey, number]> = [
  ...(["paper", "sheet", "well", "field"] as const).flatMap((bg) => [["ink", bg, 4.5], ["ink2", bg, 4.5]] as Array<[TokenKey, TokenKey, number]>),
  ["sig-on", "sig", 4.5],
  ["ink", "sig-tint", 4.5],
  ["link", "sheet", 4.5],
  ["link", "paper", 4.5],
  ...(["ok", "warn", "err", "info"] as const).flatMap((tone) => [[tone, `${tone}-tint`, 4.5], [tone, "sheet", 4.5]] as Array<[TokenKey, TokenKey, number]>),
  ["rule2", "sheet", 3],
  ["rule2", "paper", 3],
  ["rule2", "field", 3],
  ["sig", "sheet", 3],
  ["sig", "paper", 3],
];

export function contrastFailures(t: PaletteTokens): string[] {
  return CONTRAST_PAIRS.filter(([fg, bg, min]) => contrast(t[fg], t[bg]) < min).map(
    ([fg, bg, min]) => `${fg}/${bg} ${contrast(t[fg], t[bg]).toFixed(2)} < ${min}`,
  );
}
