"use client";

import { Receipt } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import type { ISetting } from "@/features/settings/model";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Features">>;

export function FeaturesTabTax({
  settings,
  t,
  onEnable,
  onPercentage,
  onIncluded,
}: {
  settings: Partial<ISetting>;
  t: TFn;
  onEnable: (checked: boolean) => void;
  onPercentage: (value: number) => void;
  onIncluded: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-primary" />
            <label htmlFor="enableTax" className="cursor-pointer text-base font-semibold">
              {t("tax-module")}
            </label>
          </div>
          <p className="text-sm text-muted-foreground">{t("enable-tax-on-bookings")}</p>
        </div>
        <Switch
          id="enableTax"
          checked={settings.enableTax ?? false}
          onCheckedChange={onEnable}
        />
      </div>
      {settings.enableTax ? (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="flex items-center gap-4">
            <label htmlFor="taxPercentage" className="text-sm font-medium">
              {t("tax-percentage")}
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="taxPercentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="h-11 w-24"
                value={settings.taxPercentage ?? 0}
                onChange={(event) =>
                  onPercentage(parseFloat(event.target.value) || 0)
                }
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("tax-percentage-description")}
          </p>
          <div className="flex items-center gap-3 border-t pt-4">
            <Switch
              id="taxIncluded"
              checked={settings.taxIncluded ?? false}
              onCheckedChange={onIncluded}
            />
            <div className="space-y-1">
              <label htmlFor="taxIncluded" className="cursor-pointer text-sm font-medium">
                {t("tax-included")}
              </label>
              <p className="text-xs text-muted-foreground">
                {t("tax-included-description")}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
