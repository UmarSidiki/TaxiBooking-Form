"use client";

import { Input } from "@/shared/ui/input";
import { ISetting } from "@/features/settings/model";
import { useTranslations } from "next-intl";

/** Corner sharpness. Colours live in the palette picker and the custom palette editor. */
export default function AppearanceTab({
  settings,
  handleBorderRadiusChange,
}: {
  settings: Partial<ISetting>;
  handleBorderRadiusChange: (value: number) => void;
}) {
  const t = useTranslations();

  return (
    <div className="space-y-2">
      <label htmlFor="appearance-corner-sharpness" className="block text-sm font-medium">
        {t("Dashboard.Settings.corner-sharpness")}
      </label>
      <Input
        id="appearance-corner-sharpness"
        name="appearance-corner-sharpness"
        type="number"
        min={0}
        max={1.5}
        step={0.25}
        className="h-11 w-32"
        value={settings.borderRadius ?? 0.5}
        onChange={(e) => handleBorderRadiusChange(parseFloat(e.target.value) || 0)}
      />
      <p className="text-xs text-muted-foreground">
        {t("Dashboard.Settings.controls-the-roundness-of-buttons-inputs-and-cards")}{" "}
        {t("Dashboard.Settings.corner-sharpness-scope")}
      </p>
    </div>
  );
}
