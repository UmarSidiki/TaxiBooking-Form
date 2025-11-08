import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Square, Circle } from "lucide-react";
import { ISetting } from "@/models/settings";
import { useTranslations } from "next-intl";

interface AppearanceTabProps {
  settings: Partial<ISetting>;
  handleColorChange: (key: "primaryColor" | "secondaryColor", value: string) => void;
  handleBorderRadiusChange: (value: number) => void;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({
  settings,
  handleColorChange,
  handleBorderRadiusChange,
}) => {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Dashboard.Settings.theme-and-appearance")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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