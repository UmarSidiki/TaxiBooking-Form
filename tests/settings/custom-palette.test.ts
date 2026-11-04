import { describe, expect, it } from "vitest";
import { customPaletteCss, resolveCustomPalette } from "@/features/settings/lib/custom-palette";
import { contrast, contrastFailures, derivePalette, luminance } from "@/features/settings/lib/palette-tokens";
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

describe("custom palette surface overrides", () => {
  it("pins background, surface and text per mode and leaves the rest derived", () => {
    const base = derivePalette("#1E3A8A", "#0F766E");
    const d = derivePalette("#1E3A8A", "#0F766E", { light: { paper: "#F0EAD6", sheet: "#FFFDF7", ink: "#222222" }, dark: { paper: "#101418" } });
    expect(d.light.paper).toBe("#F0EAD6");
    expect(d.light.sheet).toBe("#FFFDF7");
    expect(d.light.sidebar).toBe("#FFFDF7");
    expect(d.light.ink).toBe("#222222");
    expect(d.light.field).toBe(base.light.field);
    expect(d.dark.paper).toBe("#101418");
    expect(d.dark.sheet).toBe(base.dark.sheet);
  });

  it("keeps derived muted text readable on a pinned background", () => {
    const d = derivePalette("#1E3A8A", "#0F766E", { light: { paper: "#C8C8C8" } });
    expect(contrast(d.light.ink2, d.light.paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("drops unknown keys and non-hex values on read", () => {
    const p = resolveCustomPalette({ brand: "#123456", accent: "#654321", light: { paper: "#abcdef", sheet: "red", evil: "#000000" }, dark: { ink: "url(x)" } });
    expect(p).toEqual({ brand: "#123456", accent: "#654321", light: { paper: "#ABCDEF" } });
  });

  it("renders pinned colours in the first-paint CSS", () => {
    const css = customPaletteCss({ brand: "#1E3A8A", accent: "#0F766E", light: { paper: "#F0EAD6" }, dark: { sheet: "#202830" } });
    expect(css).toContain("--paper: #F0EAD6;");
    expect(css).toContain("--sheet: #202830;");
  });

  it("existing brand/accent-only palettes render exactly as before", () => {
    expect(customPaletteCss({ brand: "#1E3A8A", accent: "#0F766E" })).toBe(
      customPaletteCss({ brand: "#1E3A8A", accent: "#0F766E", light: {}, dark: {} }),
    );
  });

  it("write schema accepts strict hex overrides and rejects anything else", () => {
    const ok = settingsWriteSchema.safeParse({ customPalette: { brand: "#111111", accent: "#222222", light: { paper: "#FFFFFF" }, dark: { ink: "#EEEEEE" } } });
    expect(ok.success).toBe(true);
    for (const bad of [{ paper: "#FFF" }, { paper: "white" }, { elev: "#000000" }, { paper: "#FFFFFF;}" }]) {
      expect(settingsWriteSchema.safeParse({ customPalette: { brand: "#111111", accent: "#222222", light: bad } }).success).toBe(false);
    }
  });
});
