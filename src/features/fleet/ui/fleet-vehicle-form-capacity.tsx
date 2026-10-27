"use client";

import { Link } from "@/shared/i18n/navigation";

import type { FleetVehicleFormFieldsProps } from "@/features/fleet/ui/fleet-vehicle-form-fields";
import { Input } from "@/shared/ui/input";
import { useTranslations } from "next-intl";

export function FleetVehicleFormCapacity({
  formData,
  setFormData,
}: FleetVehicleFormFieldsProps) {
  const t = useTranslations();
  return (
    <>

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

      <p className="text-sm text-muted-foreground sm:col-span-2">
        {t("Dashboard.Fleet.seat-prices-moved")}{" "}
        <Link href="/dashboard/pricing" className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4">
          {t("Dashboard.Fleet.seat-prices-link")}
        </Link>
      </p>
    </>
  );
}
