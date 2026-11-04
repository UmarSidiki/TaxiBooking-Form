import { cleanOverrides, derivePalette, isStrictHex, paletteCss, type ModeOverrides } from "@/features/settings/lib/palette-tokens";

export type CustomPalette = { brand: string; accent: string; light?: ModeOverrides; dark?: ModeOverrides };

const DEFAULT_CUSTOM_PALETTE: CustomPalette = { brand: "#1E3A8A", accent: "#0F766E" };

/** Keeps only strict #RRGGBB values; anything else falls back to the defaults. */
export function resolveCustomPalette(value: unknown): CustomPalette {
  const v = (value ?? {}) as Partial<CustomPalette>;
  return {
    brand: isStrictHex(v.brand) ? v.brand.toUpperCase() : DEFAULT_CUSTOM_PALETTE.brand,
    accent: isStrictHex(v.accent) ? v.accent.toUpperCase() : DEFAULT_CUSTOM_PALETTE.accent,
    ...withOverrides("light", cleanOverrides(v.light)),
    ...withOverrides("dark", cleanOverrides(v.dark)),
  };
}

function withOverrides(mode: "light" | "dark", o: ModeOverrides): Partial<CustomPalette> {
  return Object.keys(o).length ? { [mode]: o } : {};
}

const SAFE_CSS = /^[A-Za-z0-9\s:#\-\[\]="(),.\/;{}*%]*$/;

/**
 * Stylesheet for data-palette="custom", rendered in <head> on the server so the first paint is right.
 * Values come only from the derivation (normalised hex / numeric rgb()), and the result is
 * checked against a strict character set so no markup or CSS escape can slip through.
 */
export function customPaletteCss(value: unknown): string {
  const p = resolveCustomPalette(value);
  const css = paletteCss("custom", derivePalette(p.brand, p.accent, p));
  if (!SAFE_CSS.test(css) || css.includes("</")) throw new Error("Unsafe custom palette CSS");
  return css;
}
