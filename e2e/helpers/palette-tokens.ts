import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Palette ids an operator can pick (kept in step with src/features/settings/lib/color-palettes.ts). */
export const PALETTE_IDS = ["neutral", "slate", "heritage", "navy"] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];
export type PaletteMode = "light" | "dark";

export const PALETTE_MODES: readonly PaletteMode[] = ["light", "dark"];

const CSS_FILE = join(process.cwd(), "src/shared/style/riviera-palettes.css");

/** `--sig: var(--operator-accent, #171717)` resolves to its fallback when no accent is set. */
function resolveTokenValue(value: string): string {
  const trimmed = value.trim();
  const withFallback = /^var\(\s*--operator-accent\s*,\s*([^)]+)\)$/.exec(trimmed);
  return (withFallback ? withFallback[1] : trimmed).trim().toLowerCase();
}

function modeOf(selector: string): PaletteMode {
  // The light selectors carry `:not([data-riviera-theme="dark"])`; strip it
  // before looking for the real dark attribute so light never reads as dark.
  const withoutNot = selector.replace(/:not\(\[data-riviera-theme="dark"\]\)/g, "");
  return withoutNot.includes('[data-riviera-theme="dark"]') ? "dark" : "light";
}

function paletteOf(selector: string): PaletteId {
  const named = /data-palette="([a-z]+)"/.exec(selector)?.[1];
  return (PALETTE_IDS as readonly string[]).includes(named ?? "") ? (named as PaletteId) : "neutral";
}

/**
 * Reads the expected `--sig` value for each palette/mode pair straight from the
 * generated stylesheet, so a regenerated palette never silently drifts from the
 * test constants.
 */
export function parsePaletteSignatures(css = readFileSync(CSS_FILE, "utf8")): Record<string, string> {
  const signatures: Record<string, string> = {};
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sig = /--sig:\s*([^;]+);/.exec(body)?.[1];
    if (!sig) continue;
    for (const selector of selectors.split(",").map((part) => part.trim())) {
      // Only the actual form/embed scopes; skip dashboard preview scopes.
      if (!selector.includes(".riviera") || selector.includes("data-palette-scope")) continue;
      const key = `${paletteOf(selector)}-${modeOf(selector)}`;
      signatures[key] = resolveTokenValue(sig);
    }
  }
  return signatures;
}

export function paletteSignature(palette: PaletteId, mode: PaletteMode): string {
  const value = parsePaletteSignatures()[`${palette}-${mode}`];
  if (!value) throw new Error(`No --sig token in riviera-palettes.css for ${palette}/${mode}`);
  return value;
}
