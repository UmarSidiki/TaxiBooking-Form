import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ISetting } from "@/models/settings";
import { useTranslations } from "next-intl";

interface MapTabProps {
  settings: Partial<ISetting>;
  handleMapSettingsChange: (
    key: keyof ISetting,
    value: string | number | string[] | boolean
  ) => void;
}

const MapTab: React.FC<MapTabProps> = ({
  settings,
  handleMapSettingsChange,
}) => {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Dashboard.Settings.map-configuration")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Map Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.initial-location")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.initial-latitude")}
              </label>
              <Input
                type="number"
                step="any"
                placeholder="46.2044"
                value={settings.mapInitialLat ?? ""}
                onChange={(e) =>
                  handleMapSettingsChange(
                    "mapInitialLat",
                    parseFloat(e.target.value)
                  )
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t(
                  "Dashboard.Settings.default-latitude-for-the-map-center"
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.initial-longitude")}
              </label>
              <Input
                type="number"
                step="any"
                placeholder="6.1432"
                value={settings.mapInitialLng ?? ""}
                onChange={(e) =>
                  handleMapSettingsChange(
                    "mapInitialLng",
                    parseFloat(e.target.value)
                  )
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t(
                  "Dashboard.Settings.default-longitude-for-the-map-center"
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.restrictions")}
          </h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Dashboard.Settings.country-restrictions")}
            </label>
            <Input
              placeholder={t(
                "Dashboard.Settings.ch-fr-de-2-letter-country-codes-comma-separated"
              )}
              value={settings.mapCountryRestrictions?.join(", ") ?? ""}
              onChange={(e) => {
                const parsed = e.target.value
                  .split(",")
                  .map((c) => c.trim().toUpperCase())
                  .filter(Boolean);
                handleMapSettingsChange("mapCountryRestrictions", parsed);
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t(
                "Dashboard.Settings.limit-address-autocomplete-to-specific-countries-leave-empty-for-no-restrictions"
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapTab;