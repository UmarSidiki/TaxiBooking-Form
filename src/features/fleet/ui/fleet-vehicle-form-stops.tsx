"use client";

import type { FleetVehicleFormFieldsProps } from "@/features/fleet/ui/fleet-vehicle-form-fields";
import { Input } from "@/shared/ui/input";
import { useCurrency } from "@/shared/context/currency-context";
import { useTranslations } from "next-intl";

export function FleetVehicleFormStops({
  formData,
  setFormData,
}: FleetVehicleFormFieldsProps) {
  const t = useTranslations();
  const { currencySymbol } = useCurrency();
  return (
    <>
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">
          {t("Dashboard.Fleet.stop-pricing")}
        </h3>
      </div>

      <div>
        <label htmlFor="vehicle-stop-price" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.stop-base-price", {0: currencySymbol})}
        </label>
        <Input
          id="vehicle-stop-price"
          name="vehicle-stop-price"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.stopPrice}
          onChange={(e) =>
            setFormData({
              ...formData,
              stopPrice: parseFloat(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Dashboard.Fleet.stop-base-price-description")}
        </p>
      </div>

      <div>
        <label htmlFor="vehicle-stop-hour-price" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.stop-price-per-hour", {0: currencySymbol})}
        </label>
        <Input
          id="vehicle-stop-hour-price"
          name="vehicle-stop-hour-price"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={formData.stopPricePerHour}
          onChange={(e) =>
            setFormData({
              ...formData,
              stopPricePerHour: parseFloat(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Dashboard.Fleet.stop-price-per-hour-description")}
        </p>
      </div>
    </>
  );
}
