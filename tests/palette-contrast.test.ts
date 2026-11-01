import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLOR_PALETTES } from "@/features/settings/lib/color-palettes";
import { contrastFailures, luminance, type PaletteTokens } from "@/features/settings/lib/palette-tokens";

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
        const failures = contrastFailures(tokens as PaletteTokens);
        expect(failures).toEqual([]);
      });
    }
  }

  for (const id of COLOR_PALETTES) {
    it(`${id} keeps page, cards and inputs visibly apart`, () => {
      const l = sets.get(`${id}-light`)!;
      const d = sets.get(`${id}-dark`)!;
      // Light: page < cards < inputs. Dark: page < inputs < cards.
      expect(luminance(l.paper)).toBeLessThan(luminance(l.sheet) - 0.03);
      expect(luminance(l.sheet)).toBeLessThan(luminance(l.field));
      expect(luminance(d.paper)).toBeLessThan(luminance(d.field));
      expect(luminance(d.field)).toBeLessThan(luminance(d.sheet));
    });
  }
});
