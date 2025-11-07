import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Users, Car } from "lucide-react";
import type { ISetting } from "@/models/Setting";

// Simple Label component inline
const Label = ({ htmlFor, className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}
    {...props}
  >
    {children}
  </label>
);

interface FeaturesTabProps {
  settings: Partial<ISetting>;
  onSettingsChange: (key: keyof ISetting, value: boolean) => void;
}

export default function FeaturesTab({ settings, onSettingsChange }: FeaturesTabProps) {
  const t = useTranslations("Dashboard.Features");
  
  const handlePartnerChange = (checked: boolean) => {
    onSettingsChange("enablePartners", checked);
  };

  const handleDriverChange = (checked: boolean) => {
    onSettingsChange("enableDrivers", checked);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("module-management")}
          </CardTitle>
          <CardDescription>
            {t("enable-or-disable-specific-modules")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Partners Module */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <Label htmlFor="enablePartners" className="text-base font-semibold cursor-pointer">
                  {t("partners-module")}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("enable-partner-registration")}
              </p>

            </div>
            <Switch
              id="enablePartners"
              checked={settings.enablePartners ?? false}
              onCheckedChange={handlePartnerChange}
            />
          </div>

          {/* Drivers Module */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                <Label htmlFor="enableDrivers" className="text-base font-semibold cursor-pointer">
                  {t("drivers-module-legacy")}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("enable-the-legacy-drivers-system")}
              </p>

            </div>
            <Switch
              id="enableDrivers"
              checked={settings.enableDrivers ?? false}
              onCheckedChange={handleDriverChange}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {t("note-changes-to-module-settings")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
