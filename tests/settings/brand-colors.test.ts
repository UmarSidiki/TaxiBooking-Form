import { describe, expect, it } from "vitest";
import { resolveBrandColors } from "@/features/settings/lib/brand-colors";
import { brandFromSettings } from "@/features/emails/lib/brand";
import { PALETTE_PRESETS } from "@/features/settings/lib/palette-presets";
import { derivePalette } from "@/features/settings/lib/palette-tokens";

describe("resolveBrandColors", () => {
  it("defaults to the neutral palette", () => {
    expect(resolveBrandColors(null).primary).toBe(PALETTE_PRESETS.neutral.light.sig);
  });
  it("follows a preset palette and ignores the legacy primaryColor", () => {
    const c = resolveBrandColors({ colorPalette: "heritage", primaryColor: "#7C2D12" } as never);
    expect(c.primary).toBe("#8E1B2B");
    expect(c.onPrimary).toBe("#FFFFFF");
  });
  it("derives from the custom palette", () => {
    const c = resolveBrandColors({ colorPalette: "custom", customPalette: { brand: "#1E3A8A", accent: "#0F766E" } });
    expect(c.primary).toBe(derivePalette("#1E3A8A", "#0F766E").light.sig);
    expect(c.dark.sig).toBe(derivePalette("#1E3A8A", "#0F766E").dark.sig);
  });
  it("falls back to the default palette for unknown ids", () => {
    expect(resolveBrandColors({ colorPalette: "nope" }).palette).toBe("neutral");
  });
  it("feeds the email brand", () => {
    expect(brandFromSettings({ colorPalette: "navy", primaryColor: "#B45309" } as never).accent).toBe("#533AFD");
  });
});
