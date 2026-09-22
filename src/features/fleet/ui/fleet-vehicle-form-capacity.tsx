"use client";

import type { FleetVehicleFormFieldsProps } from "@/features/fleet/ui/fleet-vehicle-form-fields";
import { Input } from "@/shared/ui/input";
import { useCurrency } from "@/shared/context/currency-context";
import { useTranslations } from "next-intl";

export function FleetVehicleFormCapacity({
  formData,
  setFormData,
}: FleetVehicleFormFieldsProps) {
  const t = useTranslations();
  const { currencySymbol } = useCurrency();
  return (
    <>
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">
          {t("Dashboard.Fleet.capacity-and-features")}
        </h3>
      </div>

      <div>
        <label htmlFor="vehicle-passengers" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.persons-capacity")}{" "}
        </label>
        <Input
          id="vehicle-passengers"
          name="vehicle-passengers"
          required
          type="number"
          min="1"
          max="50"
          placeholder="4"
          value={formData.persons}
          onChange={(e) =>
            setFormData({
              ...formData,
              persons: parseInt(e.target.value) || 1,
            })
          }
        />
      </div>

      <div>
        <label htmlFor="vehicle-luggage" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.baggages-capacity")}{" "}
        </label>
        <Input
          id="vehicle-luggage"
          name="vehicle-luggage"
          required
          type="number"
          min="0"
          max="20"
          placeholder="2"
          value={formData.baggages}
          onChange={(e) =>
            setFormData({
              ...formData,
              baggages: parseInt(e.target.value) || 0,
            })
          }
        />
      </div>

      <div>
        <label htmlFor="vehicle-child-seat-price" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.child-seat-price-eur", {0: currencySymbol})}{" "}
        </label>
        <Input
          id="vehicle-child-seat-price"
          name="vehicle-child-seat-price"
          type="number"
          min="0"
          step="0.01"
          placeholder="10"
          value={formData.childSeatPrice}
          onChange={(e) =>
            setFormData({
              ...formData,
              childSeatPrice: parseFloat(e.target.value) || 0,
            })
          }
        />
      </div>

      <div>
        <label htmlFor="vehicle-baby-seat-price" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Fleet.baby-seat-price-eur", {0: currencySymbol})}{" "}
        </label>
        <Input
          id="vehicle-baby-seat-price"
          name="vehicle-baby-seat-price"
          type="number"
          min="0"
          step="0.01"
          placeholder="10"
          value={formData.babySeatPrice}
          onChange={(e) =>
            setFormData({
              ...formData,
              babySeatPrice: parseFloat(e.target.value) || 0,
            })
          }
        />
      </div>
    </>
  );
}
