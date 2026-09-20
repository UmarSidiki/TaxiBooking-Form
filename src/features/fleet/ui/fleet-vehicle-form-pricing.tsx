"use client";

import type { FleetVehicleFormFieldsProps } from "@/components/fleet/fleet-vehicle-form-fields";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslations } from "next-intl";

export function FleetVehicleFormPricing({
  formData,
  setFormData,
}: FleetVehicleFormFieldsProps) {
  const t = useTranslations();
  const { currencySymbol } = useCurrency();
  return (
    <>
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">
          {t("Dashboard.Fleet.pricing")}
        </h3>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.base-price-eur", {0: currencySymbol}) }{" "}
        </label>
        <Input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="50"
          value={formData.price}
          onChange={(e) =>
            setFormData({
              ...formData,
              price: parseFloat(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Dashboard.Fleet.starting-fare-before-distance-calculation")}{" "}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.price-per-km-eur", {0: currencySymbol})}{" "}
        </label>
        <Input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="2"
          value={formData.pricePerKm}
          onChange={(e) =>
            setFormData({
              ...formData,
              pricePerKm: parseFloat(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Dashboard.Fleet.rate-charged-per-kilometer")}{" "}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.price-per-hour-eur", {0: currencySymbol})}{" "}
        </label>
        <Input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="30"
          value={formData.pricePerHour}
          onChange={(e) =>
            setFormData({
              ...formData,
              pricePerHour: parseFloat(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Dashboard.Fleet.rate-charged-per-hour")}{" "}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.minimum-fare-eur", {0: currencySymbol})}{" "}
        </label>
        <Input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="20"
          value={formData.minimumFare}
          onChange={(e) =>
            setFormData({
              ...formData,
              minimumFare: parseFloat(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Dashboard.Fleet.minimum-charge-for-trips")}{" "}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.minimum-hours")}{" "}
        </label>
        <Input
          required
          type="number"
          min="1"
          step="1"
          placeholder="2"
          value={formData.minimumHours}
          onChange={(e) =>
            setFormData({
              ...formData,
              minimumHours: parseInt(e.target.value) || 1,
            })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Dashboard.Fleet.minimum-hours-for-bookings")}{" "}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.return-trip-price")}{" "}
        </label>
        <Input
          required
          type="number"
          min="0"
          placeholder="100"
          value={formData.returnPricePercentage}
          onChange={(e) =>
            setFormData({
              ...formData,
              returnPricePercentage: parseInt(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Dashboard.Fleet.percentage-for-return-trips")}{" "}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.discount")}
        </label>
        <Input
          type="number"
          min="0"
          max="100"
          placeholder="0"
          value={formData.discount}
          onChange={(e) =>
            setFormData({
              ...formData,
              discount: parseInt(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Dashboard.Fleet.discount-percentage")}{" "}
        </p>
      </div>
    </>
  );
}
