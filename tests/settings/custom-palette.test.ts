import { describe, expect, it } from "vitest";
import { customPaletteCss, resolveCustomPalette } from "@/features/settings/lib/custom-palette";
import { contrastFailures, derivePalette, luminance } from "@/features/settings/lib/palette-tokens";
import { settingsWriteSchema } from "@/features/settings/schema/settings-write.schema";

const SAMPLES = ["#FFFFFF", "#000000", "#FFFF00", "#00FF00", "#FF0000", "#0000FF", "#F5F5DC", "#7FFFD4", "#1E3A8A", "#B45309", "#FFC0CB", "#808080", "#C0FFEE", "#123456", "#FACADE"];

describe("custom palette derivation", () => {
  for (const brand of SAMPLES) {
    it(`${brand} yields AA light and dark tokens with a visible surface ladder`, () => {
      const p = derivePalette(brand, SAMPLES[(SAMPLES.indexOf(brand) + 3) % SAMPLES.length]);
      expect(contrastFailures(p.light)).toEqual([]);
      expect(contrastFailures(p.dark)).toEqual([]);
      expect(luminance(p.light.paper)).toBeLessThan(luminance(p.light.sheet));
      expect(luminance(p.light.sheet)).toBeLessThan(luminance(p.light.field));
      expect(luminance(p.dark.paper)).toBeLessThan(luminance(p.dark.field));
      expect(luminance(p.dark.field)).toBeLessThan(luminance(p.dark.sheet));
    });
  }

  it("reports and auto-adjusts a brand colour that is too light for white text", () => {
    const p = derivePalette("#FFD54F", "#1D4ED8");
    expect(p.adjusted.brand?.from).toBe("#FFD54F");
    expect(p.adjusted.brand?.to).toBe(p.light.sig);
    expect(derivePalette("#1E3A8A", "#1D4ED8").adjusted.brand).toBeUndefined();
  });
});

describe("custom palette CSS is injection-safe", () => {
  it("drops anything that is not strict #RRGGBB", () => {
    for (const bad of ["red", "#fff", "#12345G", "#123456;}</style><script>", "url(x)", "#1234567", "var(--x)"]) {
      expect(resolveCustomPalette({ brand: bad, accent: bad })).toEqual(resolveCustomPalette(undefined));
    }
    const css = customPaletteCss({ brand: "#123456;}</style><script>alert(1)</script>", accent: "expression(1)" });
    expect(css).not.toMatch(/<|script|expression|url\(/i);
    expect(css).toContain('[data-palette="custom"]');
  });

  it("the write schema only accepts strict hex", () => {
    expect(settingsWriteSchema.safeParse({ customPalette: { brand: "#1E3A8A", accent: "#0F766E" } }).success).toBe(true);
    for (const bad of [{ brand: "#fff", accent: "#0F766E" }, { brand: "#1E3A8A;}", accent: "#0F766E" }, { brand: "#1E3A8A", accent: "#0F766E", extra: "x" }]) {
      expect(settingsWriteSchema.safeParse({ customPalette: bad }).success).toBe(false);
    }
    expect(settingsWriteSchema.safeParse({ colorPalette: "custom" }).success).toBe(true);
  });
});
