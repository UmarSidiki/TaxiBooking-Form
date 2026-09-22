"use client";

import { FleetVehicleForm } from "@/features/fleet/ui/fleet-vehicle-form";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
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
>) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
          {t("Dashboard.Fleet.fleet-management")}
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          {t("Dashboard.Fleet.manage-your-vehicle-fleet-and-pricing")}
        </p>
      </div>
      <Dialog open={showForm} onOpenChange={(open) => {
        if (open) {
          // Reset form when opening via Add button
          if (!editingId) {
            resetForm();
          }
        }
        setShowForm(open);
      }}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              // Ensure form is reset when Add button is clicked
              resetForm();
              setShowForm(true);
            }}
            className="h-11"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("Dashboard.Fleet.add-vehicle")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("Dashboard.Fleet.edit-vehicle")
                : t("Dashboard.Fleet.add-new-vehicle")}
            </DialogTitle>
          </DialogHeader>
          <FleetVehicleForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isLoading={isLoading}
            editingId={editingId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
