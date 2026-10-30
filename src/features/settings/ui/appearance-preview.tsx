"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

import type { ISetting } from "@/features/settings/model";
import { brandName } from "@/features/settings/lib/brand-name";
import { operatorAccent } from "@/features/settings/lib/operator-accent";

/** A static, scaled-down step 1 of the public form that follows unsaved settings. */
export function AppearancePreview({ settings }: { settings: Partial<ISetting> }) {
  const t = useTranslations();
  const accent = operatorAccent(settings.primaryColor);
  const style = accent.kind === "custom" ? ({ "--operator-accent": accent.color } as CSSProperties) : undefined;
  const name = brandName(settings) || t("Riviera.brandFallback");

  return (
    <figure className="flex flex-col gap-2" aria-label={t("Dashboard.Settings.preview-title")}>
      <div className="riviera appearance-preview" style={style} aria-hidden="true">
        <p className="appearance-preview__brand">{name}</p>
        <div className="appearance-preview__field">
          <span>{t("Riviera.pickup")}</span>
          <strong>{t("Dashboard.Settings.preview-pickup")}</strong>
        </div>
        <div className="appearance-preview__field">
          <span>{t("Riviera.dropoff")}</span>
          <strong>{t("Dashboard.Settings.preview-dropoff")}</strong>
        </div>
        <span className="appearance-preview__go">{t("Dashboard.Settings.preview-continue")}</span>
      </div>
      <figcaption className="text-xs text-[color:var(--ink2)]">
        {accent.kind === "too-light" ? t("Dashboard.Settings.accent-too-light") : t("Dashboard.Settings.preview-help")}
      </figcaption>
    </figure>
  );
}
