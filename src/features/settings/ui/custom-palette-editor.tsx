"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { resolveCustomPalette, type CustomPalette } from "@/features/settings/lib/custom-palette";
import { contrast, derivePalette, isStrictHex, paletteCss } from "@/features/settings/lib/palette-tokens";

/** Paints data-palette-scope="draft" with the unsaved custom colours (light and dark follow the desk theme). */
export function DraftPaletteStyle({ value }: { value: unknown }) {
  const { brand, accent } = resolveCustomPalette(value);
  const css = useMemo(() => paletteCss("draft", derivePalette(brand, accent)), [brand, accent]);
  return <style data-draft-palette="" dangerouslySetInnerHTML={{ __html: css }} />;
}

function ColorField({
  name,
  label,
  help,
  value,
  onChange,
}: {
  name: string;
  label: string;
  help: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const id = useId();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const invalid = !isStrictHex(text);

  return (
    <div className="custom-palette__field">
      <label htmlFor={`${id}-hex`} className="custom-palette__label">{label}</label>
      <div className="custom-palette__inputs">
        <input
          type="color"
          aria-label={label}
          data-testid={`custom-${name}-picker`}
          value={value.toLowerCase()}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="custom-palette__swatch"
        />
        <input
          id={`${id}-hex`}
          data-testid={`custom-${name}-hex`}
          data-slot="input"
          dir="ltr"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          value={text}
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-help`}
          onChange={(e) => {
            const next = e.target.value.trim();
            const withHash = next.startsWith("#") ? next : `#${next}`;
            setText(withHash);
            if (isStrictHex(withHash)) onChange(withHash.toUpperCase());
          }}
          className="custom-palette__hex num"
        />
      </div>
      <p id={`${id}-help`} className="custom-palette__help" data-invalid={invalid || undefined}>
        {invalid ? t("custom-hex-invalid") : help}
      </p>
    </div>
  );
}

function Ratio({ label, ratio, min }: { label: string; ratio: number; min: number }) {
  const t = useTranslations("Dashboard.Settings");
  const pass = ratio >= min;
  return (
    <li className="custom-palette__ratio">
      <span>{label}</span>
      <span className="status-mark" data-tone={pass ? "ok" : "warn"}>
        <span className="num">{ratio.toFixed(2)}:1</span> {pass ? t("custom-pass") : t("custom-low")}
      </span>
    </li>
  );
}

export function CustomPaletteEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: CustomPalette) => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const current = resolveCustomPalette(value);
  const derived = useMemo(() => derivePalette(current.brand, current.accent), [current.brand, current.accent]);
  const { brand, accent } = derived.adjusted;

  return (
    <section className="custom-palette" aria-labelledby="custom-palette-title" data-testid="custom-palette-editor">
      <div>
        <h3 id="custom-palette-title" className="custom-palette__title">{t("custom-title")}</h3>
        <p className="custom-palette__help">{t("custom-help")}</p>
      </div>
      <div className="custom-palette__grid">
        <ColorField
          name="brand"
          label={t("custom-brand")}
          help={t("custom-brand-help")}
          value={current.brand}
          onChange={(hex) => onChange({ ...current, brand: hex })}
        />
        <ColorField
          name="accent"
          label={t("custom-accent")}
          help={t("custom-accent-help")}
          value={current.accent}
          onChange={(hex) => onChange({ ...current, accent: hex })}
        />
      </div>
      <ul className="custom-palette__ratios">
        <Ratio label={t("custom-contrast-buttons")} ratio={contrast(current.brand, "#FFFFFF")} min={4.5} />
        <Ratio label={t("custom-contrast-links")} ratio={contrast(current.accent, derived.light.paper)} min={4.5} />
      </ul>
      {brand || accent ? (
        <div className="custom-palette__warn" role="status" data-testid="custom-palette-warning">
          <p>{t("custom-adjusted")}</p>
          <div className="custom-palette__fixes">
            {brand ? (
              <button type="button" className="custom-palette__fix" onClick={() => onChange({ ...current, brand: brand.to })}>
                <span aria-hidden="true" style={{ background: brand.to }} />
                {t("custom-use-adjusted", { role: t("custom-brand"), hex: brand.to })}
              </button>
            ) : null}
            {accent ? (
              <button type="button" className="custom-palette__fix" onClick={() => onChange({ ...current, accent: accent.to })}>
                <span aria-hidden="true" style={{ background: accent.to }} />
                {t("custom-use-adjusted", { role: t("custom-accent"), hex: accent.to })}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <figure className="custom-palette__preview" data-palette-scope="draft" aria-label={t("custom-preview")} data-testid="custom-palette-preview">
        <figcaption className="custom-palette__caption">{t("custom-preview")}</figcaption>
        <div className="custom-palette__card">
          <strong>{t("custom-preview-card")}</strong>
          <span className="custom-palette__mock-input">{t("custom-preview-field")}</span>
          <div className="custom-palette__row">
            <span className="custom-palette__mock-btn">{t("custom-preview-button")}</span>
            <span className="custom-palette__mock-link">{t("custom-preview-link")}</span>
            <span className="status-mark" data-tone="ok"><span className="status-mark__dot" />{t("custom-preview-badge")}</span>
          </div>
        </div>
      </figure>
      <p className="custom-palette__help">{t("custom-auto-note")}</p>
    </section>
  );
}
