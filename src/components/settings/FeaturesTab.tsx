import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Users, Car, Receipt } from "lucide-react";
import type { ISetting } from "@/models/settings";

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
  onSettingsChange: (key: keyof ISetting, value: boolean | number) => void;
}

export default function FeaturesTab({ settings, onSettingsChange }: FeaturesTabProps) {
  const t = useTranslations("Dashboard.Features");
  
  const handlePartnerChange = (checked: boolean) => {
    onSettingsChange("enablePartners", checked);
  };

  const handleDriverChange = (checked: boolean) => {
    onSettingsChange("enableDrivers", checked);
  };

  const handleTaxChange = (checked: boolean) => {
    onSettingsChange("enableTax", checked);
  };

  const handleTaxPercentageChange = (value: number) => {
    onSettingsChange("taxPercentage", value);
  };

  const handleTaxIncludedChange = (checked: boolean) => {
    onSettingsChange("taxIncluded", checked);
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

          {/* Tax Module */}
          <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <Label htmlFor="enableTax" className="text-base font-semibold cursor-pointer">
                    {t("tax-module")}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("enable-tax-on-bookings")}
                </p>
              </div>
              <Switch
                id="enableTax"
                checked={settings.enableTax ?? false}
                onCheckedChange={handleTaxChange}
              />
            </div>
            
            {/* Tax Percentage Input - Only show when tax is enabled */}
            {settings.enableTax && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <Label htmlFor="taxPercentage" className="text-sm font-medium whitespace-nowrap">
                    {t("tax-percentage")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="taxPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-24"
                      value={settings.taxPercentage ?? 0}
                      onChange={(e) => handleTaxPercentageChange(parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("tax-percentage-description")}
                </p>
                
                {/* Tax Included Checkbox */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                  <Switch
                    id="taxIncluded"
                    checked={settings.taxIncluded ?? false}
                    onCheckedChange={handleTaxIncludedChange}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="taxIncluded" className="text-sm font-medium cursor-pointer">
                      {t("tax-included")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("tax-included-description")}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
