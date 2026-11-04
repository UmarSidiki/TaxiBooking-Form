import { resolveColorPalette, type ColorPalette } from "@/features/settings/lib/color-palettes";
import { resolveCustomPalette } from "@/features/settings/lib/custom-palette";
import { derivePalette, type PaletteSet, type PaletteTokens } from "@/features/settings/lib/palette-tokens";
import { PALETTE_PRESETS } from "@/features/settings/lib/palette-presets";

export type BrandColors = {
  palette: ColorPalette;
  /** Light-mode tokens: emails, PDFs and anything without a dark mode use these. */
  light: PaletteTokens;
  dark: PaletteTokens;
  /** Button / accent colour on a light surface. */
  primary: string;
  /** Text colour that sits on `primary`. */
  onPrimary: string;
  /** Body text colour on a light surface. */
  ink: string;
  /** Muted text colour on a light surface. */
  ink2: string;
  /** Link colour on a light surface. */
  link: string;
  /** Hairline border on a light surface. */
  rule: string;
  /** Soft tinted background behind the accent. */
  tint: string;
};

/**
 * The one source of brand colours for every surface (web, emails, invoices, embeds).
 * The active palette wins; the legacy primaryColor/secondaryColor fields are never read.
 */
export function resolveBrandColors(settings: { colorPalette?: unknown; customPalette?: unknown } | null | undefined): BrandColors {
  const palette = resolveColorPalette(settings?.colorPalette);
  let set: PaletteSet;
  if (palette === "custom") {
    const custom = resolveCustomPalette(settings?.customPalette);
    set = derivePalette(custom.brand, custom.accent, custom);
  } else {
    set = PALETTE_PRESETS[palette];
  }
  const { light, dark } = set;
  return {
    palette,
    light,
    dark,
    primary: light.sig,
    onPrimary: light["sig-on"],
    ink: light.ink,
    ink2: light.ink2,
    link: light.link,
    rule: light.rule,
    tint: light["sig-tint"],
  };
}
