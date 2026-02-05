import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Square, Circle, Globe } from "lucide-react";
import { ISetting } from "@/models/settings";
import { useTranslations } from "next-intl";

interface AppearanceTabProps {
  settings: Partial<ISetting>;
  handleColorChange: (key: "primaryColor" | "secondaryColor", value: string) => void;
  handleBorderRadiusChange: (value: number) => void;
  handleTimezoneChange: (value: string) => void;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({
  settings,
  handleColorChange,
  handleBorderRadiusChange,
  handleTimezoneChange,
}) => {
  const t = useTranslations();
  const timezones = Intl.supportedValuesOf('timeZone');


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Dashboard.Settings.theme-and-appearance")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timezone Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.regional-settings")}
          </h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Dashboard.Settings.timezone")}
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                value={settings.timezone || "Europe/Zurich"}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select your local timezone for accurate booking times and email notifications.
            </p>
          </div>
        </div>

        {/* Color Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.color-scheme")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.primary-color")}
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Input
                  type="color"
                  className="w-12 h-10 p-1"
                  value={settings.primaryColor || "#EAB308"}
                  onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                />
                <Input
                  placeholder="#EAB308"
                  value={settings.primaryColor || ""}
                  onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.used-for-buttons-highlights-and-main-actions")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.secondary-color")}
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Input
                  type="color"
                  className="w-12 h-10 p-1"
                  value={settings.secondaryColor || "#111827"}
                  onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                />
                <Input
                  placeholder="#111827"
                  value={settings.secondaryColor || ""}
                  onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.used-for-text-backgrounds-and-secondary-elements")}
              </p>
            </div>
          </div>
        </div>

        {/* Border Radius Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.border-radius")}
          </h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Dashboard.Settings.corner-sharpness")}
            </label>
            <div className="flex items-center gap-4">
              <Square className="h-5 w-5" />
              <Input
                type="range"
                min="0"
                max="1.5"
                step="0.25"
                value={settings.borderRadius ?? 0.5}
                onChange={(e) => handleBorderRadiusChange(parseFloat(e.target.value))}
                className="w-full max-w-xs"
              />
              <Circle className="h-5 w-5" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t("Dashboard.Settings.controls-the-roundness-of-buttons-inputs-and-cards")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceTab;