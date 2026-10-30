/** The schema default every settings document carries; it means "not customised". */
export const LEGACY_DEFAULT_PRIMARY = "#B45309";

const HEX = /^#([0-9a-f]{6})$/i;

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastWithWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

export type AccentVerdict =
  | { kind: "default" }
  | { kind: "too-light"; contrast: number }
  | { kind: "custom"; color: string };

/**
 * Whether the operator's primary colour can replace the Riviera light-mode accent.
 * Buttons carry white text, so the colour must reach WCAG AA (4.5:1) against white.
 */
export function operatorAccent(primaryColor?: string | null): AccentVerdict {
  const value = primaryColor?.trim() ?? "";
  if (!HEX.test(value) || value.toUpperCase() === LEGACY_DEFAULT_PRIMARY) return { kind: "default" };
  const contrast = contrastWithWhite(value);
  return contrast >= 4.5 ? { kind: "custom", color: value } : { kind: "too-light", contrast };
}
