"use client";

import { useTranslations } from "next-intl";

import {
  COLOR_PALETTES,
  resolveColorPalette,
  type ColorPalette,
} from "@/features/settings/lib/color-palettes";

/** Swatch roles shown per palette; colours come from that palette's CSS tokens. */
const SWATCH_TOKENS = ["--paper", "--sheet", "--ink", "--sig", "--link"] as const;

export function PalettePicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: ColorPalette) => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const selected = resolveColorPalette(value);

  return (
    <fieldset className="palette-picker">
      <legend className="palette-picker__legend">{t("palette-title")}</legend>
      <p className="palette-picker__help">{t("palette-help")}</p>
      <div className="palette-picker__grid" role="radiogroup">
        {COLOR_PALETTES.map((id) => (
          <label key={id} className="palette-picker__option" data-palette-scope={id} data-selected={id === selected || undefined}>
            <input
              type="radio"
              name="color-palette"
              value={id}
              checked={id === selected}
              onChange={() => onChange(id)}
              className="palette-picker__radio"
            />
            <span className="palette-picker__swatches" aria-hidden="true">
              {SWATCH_TOKENS.map((token) => (
                <span key={token} style={{ background: `var(${token})` }} />
              ))}
            </span>
            <span className="palette-picker__name">{t(`palette-${id}`)}</span>
            <span className="palette-picker__note">{t(`palette-${id}-note`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
