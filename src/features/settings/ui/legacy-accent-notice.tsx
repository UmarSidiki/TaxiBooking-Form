"use client";

import { useTranslations } from "next-intl";

import { operatorAccent } from "@/features/settings/lib/operator-accent";

/**
 * Older operators saved a standalone "primary colour" that still tints preset buttons.
 * Instead of a separate field, show it here once and offer to fold it into the palette system.
 */
export function LegacyAccentNotice({
  primaryColor,
  onMoveToCustom,
  onDrop,
}: {
  primaryColor?: string | null;
  onMoveToCustom: (hex: string) => void;
  onDrop: () => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const verdict = operatorAccent(primaryColor);
  if (verdict.kind !== "custom") return null;
  const hex = verdict.color.toUpperCase();
  return (
    <div className="legacy-accent" role="note" data-testid="legacy-accent">
      <p>
        <span className="legacy-accent__swatch" style={{ background: hex }} aria-hidden="true" />
        {t("legacy-accent-text", { hex })}
      </p>
      <div className="custom-palette__fixes">
        <button type="button" className="custom-palette__fix" data-testid="legacy-accent-move" onClick={() => onMoveToCustom(hex)}>
          {t("legacy-accent-move")}
        </button>
        <button type="button" className="custom-palette__fix" data-testid="legacy-accent-drop" onClick={onDrop}>
          {t("legacy-accent-drop")}
        </button>
      </div>
    </div>
  );
}

