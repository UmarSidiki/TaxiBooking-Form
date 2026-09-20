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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 lg:mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("Dashboard.Fleet.fleet-management")}{" "}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {t("Dashboard.Fleet.manage-your-vehicle-fleet-and-pricing")}{" "}
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
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {t("Dashboard.Fleet.add-vehicle")}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
