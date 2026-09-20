"use client";

import type { FleetVehicleFormFieldsProps } from "@/components/fleet/fleet-vehicle-form-fields";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
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
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.persons-capacity")}{" "}
        </label>
        <Input
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
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.baggages-capacity")}{" "}
        </label>
        <Input
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
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.child-seat-price-eur", {0: currencySymbol})}{" "}
        </label>
        <Input
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
        <label className="block text-sm font-medium mb-2">
          {t("Dashboard.Fleet.baby-seat-price-eur", {0: currencySymbol})}{" "}
        </label>
        <Input
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
