"use client";

import { FleetVehicleFormBasic } from "@/components/fleet/fleet-vehicle-form-basic";
import { FleetVehicleFormCapacity } from "@/components/fleet/fleet-vehicle-form-capacity";
import { FleetVehicleFormPricing } from "@/components/fleet/fleet-vehicle-form-pricing";
import { FleetVehicleFormStops } from "@/components/fleet/fleet-vehicle-form-stops";
import type { VehicleForm } from "@/components/fleet/vehicle-form.types";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";

export function FleetVehicleForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  editingId,
}: {
  formData: VehicleForm;
  setFormData: (data: VehicleForm) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  editingId: string | null;
}) {
  const t = useTranslations();
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <FleetVehicleFormBasic formData={formData} setFormData={setFormData} />

        {/* Pricing Section */}
        <FleetVehicleFormPricing formData={formData} setFormData={setFormData} />

        {/* Capacity Section */}
        <FleetVehicleFormCapacity formData={formData} setFormData={setFormData} />

        {/* Stop Pricing Section */}
        <FleetVehicleFormStops formData={formData} setFormData={setFormData} />

        {/* Status */}
        <div className="md:col-span-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              {t("Dashboard.Fleet.active-available-for-booking")}{" "}
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {editingId
                ? t("Dashboard.Fleet.update-vehicle")
                : t("Dashboard.Fleet.add-vehicle")}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Dashboard.Fleet.cancel")}{" "}
        </Button>
      </div>
    </form>
  );
}
