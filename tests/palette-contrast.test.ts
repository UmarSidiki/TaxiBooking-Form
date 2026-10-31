import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLOR_PALETTES } from "@/features/settings/lib/color-palettes";

const css = readFileSync("src/shared/style/riviera-palettes.css", "utf8");

function blocks() {
  const out = new Map<string, Record<string, string>>();
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const palette = /data-palette-scope="(\w+)"/.exec(selector)?.[1];
    if (!palette) continue;
    const mode = selector.includes(':root[data-riviera-theme="dark"]') ? "dark" : "light";
    const tokens: Record<string, string> = {};
    for (const [, k, v] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
      tokens[k] = /var\(--operator-accent,\s*(#\w+)\)/.exec(v)?.[1] ?? v.trim();
    }
    out.set(`${palette}-${mode}`, tokens);
  }
  return out;
}

function luminance(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [foreground, background, minimum]. Text 4.5:1; input borders, primary and focus 3:1 (WCAG 1.4.3 / 1.4.11). */
const PAIRS: Array<[string, string, number]> = [
  ...["paper", "sheet", "well"].flatMap((bg) => [["ink", bg, 4.5], ["ink2", bg, 4.5]] as Array<[string, string, number]>),
  ["sig-on", "sig", 4.5],
  ["ink", "sig-tint", 4.5],
  ["link", "sheet", 4.5],
  ["link", "paper", 4.5],
  ...["ok", "warn", "err", "info"].flatMap((tone) => [[tone, `${tone}-tint`, 4.5], [tone, "sheet", 4.5]] as Array<[string, string, number]>),
  ["rule2", "sheet", 3],
  ["rule2", "paper", 3],
  ["sig", "sheet", 3],
  ["sig", "paper", 3],
];

describe("palette tokens meet WCAG AA", () => {
  const sets = blocks();

  it("defines light and dark for every palette", () => {
    for (const id of COLOR_PALETTES) {
      expect(sets.has(`${id}-light`), `${id}-light`).toBe(true);
      expect(sets.has(`${id}-dark`), `${id}-dark`).toBe(true);
    }
  });

  for (const id of COLOR_PALETTES) {
    for (const mode of ["light", "dark"]) {
      it(`${id} ${mode}`, () => {
        const tokens = sets.get(`${id}-${mode}`)!;
        const failures = PAIRS.filter(([fg, bg, min]) => contrast(tokens[fg], tokens[bg]) < min).map(
          ([fg, bg, min]) => `${fg}/${bg} ${contrast(tokens[fg], tokens[bg]).toFixed(2)} < ${min}`,
        );
        expect(failures).toEqual([]);
      });
    }
  }
});
