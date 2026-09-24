"use client";

import type { FleetVehicleFormFieldsProps } from "@/features/fleet/ui/fleet-vehicle-form-fields";
import { Input } from "@/shared/ui/input";
import { useCurrency } from "@/shared/context/currency-context";
import { useTranslations } from "next-intl";

export function FleetVehicleFormPricing({
  formData,
  setFormData,
}: FleetVehicleFormFieldsProps) {
  const t = useTranslations();
  const { currencySymbol } = useCurrency();
  return (
    <>

      <div>
        <label htmlFor="vehicle-base-price" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.base-price-eur", {0: currencySymbol}) }{" "}
        </label>
        <Input
          id="vehicle-base-price"
          name="vehicle-base-price"
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
        <label htmlFor="vehicle-price-km" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.price-per-km-eur", {0: currencySymbol})}{" "}
        </label>
        <Input
          id="vehicle-price-km"
          name="vehicle-price-km"
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
        <label htmlFor="vehicle-price-hour" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.price-per-hour-eur", {0: currencySymbol})}{" "}
        </label>
        <Input
          id="vehicle-price-hour"
          name="vehicle-price-hour"
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
        <label htmlFor="vehicle-minimum-fare" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.minimum-fare-eur", {0: currencySymbol})}{" "}
        </label>
        <Input
          id="vehicle-minimum-fare"
          name="vehicle-minimum-fare"
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
        <label htmlFor="vehicle-minimum-hours" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.minimum-hours")}{" "}
        </label>
        <Input
          id="vehicle-minimum-hours"
          name="vehicle-minimum-hours"
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
        <label htmlFor="vehicle-return-percent" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.return-trip-price")}{" "}
        </label>
        <Input
          id="vehicle-return-percent"
          name="vehicle-return-percent"
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
        <label htmlFor="vehicle-discount" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.discount")}
        </label>
        <Input
          id="vehicle-discount"
          name="vehicle-discount"
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
