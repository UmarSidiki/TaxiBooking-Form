"use client";

import type { ReactNode } from "react";

import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { DeskToolbar } from "@/features/dashboard/ui/desk-toolbar";
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
  filters,
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
> & { vehicleCount: number; filters: ReactNode }) {
  const fleetHelp = t("Dashboard.Fleet.manage-your-vehicle-fleet-and-pricing");
  const description =
    vehicleCount > 0 ? `${fleetHelp} · ${vehicleCount}` : fleetHelp;

  return (
    <>
      <DeskPageMeta
        title={t("Dashboard.Fleet.fleet-management")}
        description={description}
      />
      <DeskToolbar>
        {filters}
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="h-10 w-full shrink-0 rounded-xl gap-1.5 px-4 font-semibold xl:w-auto"
          id="fleet-add-vehicle-btn"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("Dashboard.Fleet.add-vehicle")}
        </Button>
      </DeskToolbar>

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
