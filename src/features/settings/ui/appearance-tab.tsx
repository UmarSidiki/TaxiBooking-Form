"use client";

import { Input } from "@/shared/ui/input";
import { ISetting } from "@/features/settings/model";
import { useTranslations } from "next-intl";
import { AppearanceTimezoneField } from "@/features/settings/ui/appearance-tab-timezone";

interface AppearanceTabProps {
  settings: Partial<ISetting>;
  handleColorChange: (
    key: "primaryColor" | "secondaryColor",
    value: string
  ) => void;
  handleBorderRadiusChange: (value: number) => void;
  handleTimezoneChange: (value: string) => void;
}

export default function AppearanceTab({
  settings,
  handleColorChange,
  handleBorderRadiusChange,
  handleTimezoneChange,
}: AppearanceTabProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <AppearanceTimezoneField
        value={settings.timezone || "Europe/Zurich"}
        onChange={handleTimezoneChange}
        label={t("Dashboard.Settings.timezone")}
        help={t("Dashboard.Settings.timezone_help")}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ColorField
          id="appearance-primary-color"
          label={t("Dashboard.Settings.primary-color")}
          value={settings.primaryColor || "#EAB308"}
          fallback="#EAB308"
          help={t("Dashboard.Settings.used-for-buttons-highlights-and-main-actions")}
          onChange={(value) => handleColorChange("primaryColor", value)}
        />
        <ColorField
          id="appearance-secondary-color"
          label={t("Dashboard.Settings.secondary-color")}
          value={settings.secondaryColor || "#111827"}
          fallback="#111827"
          help={t("Dashboard.Settings.used-for-text-backgrounds-and-secondary-elements")}
          onChange={(value) => handleColorChange("secondaryColor", value)}
        />
      </div>
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
          {t("Dashboard.Settings.controls-the-roundness-of-buttons-inputs-and-cards")}
        </p>
      </div>
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  fallback,
  help,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  fallback: string;
  help: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={`${id}-text`} className="mb-2 block text-sm font-medium">{label}</label>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <Input
          id={`${id}-picker`}
          aria-label={label}
          type="color"
          className="h-11 w-12 p-1"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input
          id={`${id}-text`}
          name={id}
          placeholder={fallback}
          className="h-11"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{help}</p>
    </div>
  );
}
