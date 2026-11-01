/** Colour palettes the operator can pick. Token values live in shared/style/riviera-palettes.css. */
/** Presets with a stylesheet block in riviera-palettes.css. */
export const PRESET_PALETTES = ["neutral", "slate", "heritage", "navy", "forest", "ocean", "amber", "plum", "terracotta", "steel"] as const;

/** Everything an operator can pick; "custom" is derived from their own colours at render time. */
export const COLOR_PALETTES = [...PRESET_PALETTES, "custom"] as const;

export type ColorPalette = (typeof COLOR_PALETTES)[number];

export const DEFAULT_COLOR_PALETTE: ColorPalette = "neutral";

export function isColorPalette(value: unknown): value is ColorPalette {
  return typeof value === "string" && (COLOR_PALETTES as readonly string[]).includes(value);
}

/** Unknown or missing values (older settings documents) fall back to the default. */
export function resolveColorPalette(value: unknown): ColorPalette {
  return isColorPalette(value) ? value : DEFAULT_COLOR_PALETTE;
}
