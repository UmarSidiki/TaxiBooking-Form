import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/en.json";
import { Setting } from "@/features/settings/model";
import { settingsWriteSchema } from "@/features/settings/schema/settings-write.schema";
import { COLOR_PALETTES, PRESET_PALETTES, resolveColorPalette } from "@/features/settings/lib/color-palettes";
import { PalettePicker } from "@/features/settings/ui/palette-picker";
import { StatusMark } from "@/features/dashboard/ui/riviera/status-mark";

describe("colour palette setting", () => {
  it("accepts known palettes and rejects anything else", () => {
    for (const id of COLOR_PALETTES) {
      expect(settingsWriteSchema.parse({ colorPalette: id }).colorPalette).toBe(id);
    }
    expect(settingsWriteSchema.safeParse({ colorPalette: "rainbow" }).success).toBe(false);
    expect(settingsWriteSchema.parse({}).colorPalette).toBeUndefined();
  });

  it("defaults new and legacy documents to neutral", () => {
    expect(new Setting({}).colorPalette).toBe("neutral");
    expect(resolveColorPalette(undefined)).toBe("neutral");
    expect(resolveColorPalette("bogus")).toBe("neutral");
    expect(resolveColorPalette("navy")).toBe("navy");
  });

  it("renders one scoped option per palette and marks the saved one", () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PalettePicker value="heritage" onChange={() => {}} />
      </NextIntlClientProvider>,
    );
    for (const id of PRESET_PALETTES) expect(html).toContain(`data-palette-scope="${id}"`);
    expect(html).toContain(`data-testid="palette-option-custom"`);
    expect(html).toMatch(/data-palette-scope="heritage" data-selected="true"/);
    expect(html).toContain("Ivory &amp; Oxblood");
  });

  it("renders status badges with a tone attribute, not inline colours", () => {
    const html = renderToStaticMarkup(<StatusMark tone="warn" label="Pending" />);
    expect(html).toContain('data-tone="warn"');
    expect(html).not.toMatch(/style=/);
  });
});
