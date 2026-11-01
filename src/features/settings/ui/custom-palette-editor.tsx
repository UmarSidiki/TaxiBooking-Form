"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { resolveCustomPalette, type CustomPalette } from "@/features/settings/lib/custom-palette";
import {
  contrast,
  derivePalette,
  isStrictHex,
  OVERRIDE_KEYS,
  TOKEN_KEYS,
  type OverrideKey,
  type PaletteTokens,
} from "@/features/settings/lib/palette-tokens";

type Mode = "light" | "dark";

/** Declarations for one mode; every value comes from derivePalette, never from raw input. */
const tokenBlock = (t: PaletteTokens) => TOKEN_KEYS.map((k) => `--${k}: ${t[k]};`).join(" ");

/** Paints every draft scope (picker swatch, live preview, light/dark editor previews) with the unsaved custom colours. */
export function DraftPaletteStyle({ value }: { value: unknown }) {
  const p = resolveCustomPalette(value);
  const key = JSON.stringify(p);
  const css = useMemo(() => {
    const d = derivePalette(p.brand, p.accent, p);
    // "draft" follows the desk theme (picker swatch, sidebar preview); the editor previews pin one mode each.
    return [
      `:root:not([data-riviera-theme="dark"]) .riviera [data-palette-scope="draft"], .riviera [data-palette-scope="draft-light"] { ${tokenBlock(d.light)} }`,
      `:root[data-riviera-theme="dark"] .riviera [data-palette-scope="draft"], .riviera [data-palette-scope="draft-dark"] { ${tokenBlock(d.dark)} }`,
    ].join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return <style data-draft-palette="" dangerouslySetInnerHTML={{ __html: css }} />;
}

function ColorField({
  name,
  label,
  help,
  value,
  onChange,
  onReset,
}: {
  name: string;
  label: string;
  help: string;
  value: string;
  onChange: (hex: string) => void;
  /** Present when the value is pinned by hand; clears it back to automatic. */
  onReset?: () => void;
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
        {onReset ? (
          <button type="button" className="custom-palette__reset" data-testid={`custom-${name}-reset`} onClick={onReset}>
            {t("custom-reset-one")}
          </button>
        ) : null}
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
  const [mode, setMode] = useState<Mode>("light");
  const current = resolveCustomPalette(value);
  const derived = useMemo(() => derivePalette(current.brand, current.accent, current), [current]);
  const { brand, accent } = derived.adjusted;
  const pinned = current[mode] ?? {};
  const tokens = derived[mode];

  const setPin = (key: OverrideKey, hex: string | null) => {
    const next = { ...pinned };
    if (hex) next[key] = hex;
    else delete next[key];
    const rest = { ...current };
    delete rest[mode];
    onChange(Object.keys(next).length ? { ...rest, [mode]: next } : rest);
  };
  const resetMode = () => {
    const rest = { ...current };
    delete rest[mode];
    onChange(rest);
  };
  const textPairs = (["ink", "ink2"] as const).flatMap((fg) =>
    (["paper", "sheet", "field"] as const).map((bg) => ({ fg, bg, ratio: contrast(tokens[fg], tokens[bg]) })),
  );
  const failing = textPairs.filter((p) => p.ratio < 4.5);

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

      <div className="custom-palette__surfaces" data-testid="custom-surfaces">
        <div className="custom-palette__surfaces-head">
          <div>
            <h4 className="custom-palette__title">{t("custom-surfaces-title")}</h4>
            <p className="custom-palette__help">{t("custom-surfaces-help")}</p>
          </div>
          <div className="custom-palette__modes" role="group" aria-label={t("custom-mode")}>
            {(["light", "dark"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} data-testid={`custom-mode-${m}`} onClick={() => setMode(m)}>
                {t(m === "light" ? "custom-mode-light" : "custom-mode-dark")}
              </button>
            ))}
          </div>
        </div>
        <div className="custom-palette__grid">
          {OVERRIDE_KEYS.map((key) => (
            <ColorField
              key={`${mode}-${key}`}
              name={key}
              label={t(`custom-token-${key}`)}
              help={t(`custom-token-${key}-help`)}
              value={tokens[key]}
              onChange={(hex) => setPin(key, hex)}
              onReset={pinned[key] ? () => setPin(key, null) : undefined}
            />
          ))}
        </div>
        <ul className="custom-palette__ratios" data-testid="custom-text-ratios">
          {textPairs.map((p) => (
            <Ratio key={`${p.fg}-${p.bg}`} label={`${t(`custom-token-${p.fg}`)} / ${t(`custom-token-${p.bg}`)}`} ratio={p.ratio} min={4.5} />
          ))}
        </ul>
        {failing.length ? (
          <p className="custom-palette__warn" role="status" data-testid="custom-text-warning">{t("custom-text-low")}</p>
        ) : null}
        <button type="button" className="custom-palette__fix" data-testid="custom-reset-mode" disabled={!Object.keys(pinned).length} onClick={resetMode}>
          {t("custom-reset-mode")}
        </button>
      </div>

      <div className="custom-palette__previews">
        {(["light", "dark"] as const).map((m) => (
          <figure key={m} className="custom-palette__preview" data-palette-scope={`draft-${m}`} aria-label={`${t("custom-preview")} (${t(m === "light" ? "custom-mode-light" : "custom-mode-dark")})`} data-testid={`custom-palette-preview-${m}`}>
            <figcaption className="custom-palette__caption">{t(m === "light" ? "custom-mode-light" : "custom-mode-dark")}</figcaption>
            <div className="custom-palette__card">
              <strong>{t("custom-preview-card")}</strong>
              <span className="custom-palette__mock-input">{t("custom-preview-field")}</span>
              <span className="custom-palette__mock-muted">{t("custom-token-ink2")}</span>
              <div className="custom-palette__row">
                <span className="custom-palette__mock-btn">{t("custom-preview-button")}</span>
                <span className="custom-palette__mock-link">{t("custom-preview-link")}</span>
                <span className="status-mark" data-tone="ok"><span className="status-mark__dot" />{t("custom-preview-badge")}</span>
              </div>
            </div>
          </figure>
        ))}
      </div>
      <p className="custom-palette__help">{t("custom-auto-note")}</p>
    </section>
  );
}
