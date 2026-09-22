"use client";

import { FleetVehicleFormBasic } from "@/features/fleet/ui/fleet-vehicle-form-basic";
import { FleetVehicleFormCapacity } from "@/features/fleet/ui/fleet-vehicle-form-capacity";
import { FleetVehicleFormPricing } from "@/features/fleet/ui/fleet-vehicle-form-pricing";
import { FleetVehicleFormStops } from "@/features/fleet/ui/fleet-vehicle-form-stops";
import type { VehicleForm } from "@/features/fleet/ui/vehicle-form.types";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
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
          <div className="flex min-h-11 items-center gap-3">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              {t("Dashboard.Fleet.active-available-for-booking")}
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row">
        <Button type="submit" disabled={isLoading} className="min-h-11 flex-1">
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("Dashboard.Settings.saving")}
            </>
          ) : (
            <>
              <Save className="size-4" aria-hidden="true" />
              {editingId
                ? t("Dashboard.Fleet.update-vehicle")
                : t("Dashboard.Fleet.add-vehicle")}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="min-h-11">
          {t("Dashboard.Fleet.cancel")}
        </Button>
      </div>
    </form>
  );
}
