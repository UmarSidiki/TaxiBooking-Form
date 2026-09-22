const INK = "#1c1917";
const PAPER = "#ffffff";

function channel(hex: string, index: number): number {
  const value = parseInt(hex.slice(index, index + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number | null {
  const raw = color.trim().replace("#", "");
  const hex = raw.length === 3 ? raw.split("").map((part) => part + part).join("") : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 2) + 0.0722 * channel(hex, 4);
}

function contrast(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Picks ink or paper, whichever stays readable on `background`. */
export function readableOn(background: string | undefined, fallback = INK): string {
  const level = background ? luminance(background) : null;
  const inkLevel = luminance(INK) ?? 0.01;
  if (level == null) return fallback;
  return contrast(1, level) >= contrast(inkLevel, level) ? PAPER : INK;
}

export function v4ToneVars(input: {
  panel?: string;
  button?: string;
  radiusRem?: number;
}): Record<string, string> {
  const panel = input.panel || "#EAB308";
  const button = input.button || "#111827";
  const radius = typeof input.radiusRem === "number" ? input.radiusRem : 0.5;
  return {
    "--v4-panel": panel,
    "--v4-button": button,
    "--v4-title": readableOn(panel),
    "--v4-ink": readableOn(panel),
    "--v4-on-button": readableOn(button),
    "--v4-card-radius": `${radius * 2.2}rem`,
    "--v4-field-radius": `${radius * 1.15}rem`,
    "--v4-button-radius": `${radius * 8}rem`,
  };
}
