"use client";

import { FleetVehicleDrawer } from "@/features/fleet/ui/fleet-vehicle-drawer";
import { Button } from "@/shared/ui/button";
import type { useAdminFleet } from "@/features/fleet/hooks/useAdminFleet";
import { Plus } from "lucide-react";

type AdminFleetState = ReturnType<typeof useAdminFleet>;

export function FleetPageHeader({
  t,
  showForm,
  setShowForm,
  editingId,
  resetForm,
  formData,
  setFormData,
  handleSubmit,
  isLoading,
  vehicleCount,
}: Pick<
  AdminFleetState,
  | "t"
  | "showForm"
  | "setShowForm"
  | "editingId"
  | "resetForm"
  | "formData"
  | "setFormData"
  | "handleSubmit"
  | "isLoading"
> & { vehicleCount: number }) {
  return (
    <>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        {/* Title block */}
        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            {t("Dashboard.Fleet.fleet-management")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Dashboard.Fleet.manage-your-vehicle-fleet-and-pricing")}
            {vehicleCount > 0 && (
              <span className="ms-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                {vehicleCount}
              </span>
            )}
          </p>
        </div>

        {/* Add button */}
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="h-10 shrink-0 rounded-xl gap-1.5 px-4 font-semibold"
          id="fleet-add-vehicle-btn"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("Dashboard.Fleet.add-vehicle")}
        </Button>
      </div>

      {/* Slide-over drawer */}
      <FleetVehicleDrawer
        open={showForm}
        onOpenChange={(open) => {
          if (!open) resetForm();
          else setShowForm(true);
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        isLoading={isLoading}
        editingId={editingId}
      />
    </>
  );
}
