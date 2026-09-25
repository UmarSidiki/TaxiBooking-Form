"use client";

import { FleetPageFilters } from "@/features/fleet/ui/fleet-page-filters";
import { FleetPageGrid } from "@/features/fleet/ui/fleet-page-grid";
import { FleetPageHeader } from "@/features/fleet/ui/fleet-page-header";
import { useAdminFleet } from "@/features/fleet/hooks/useAdminFleet";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { DeskNotice } from "@/features/dashboard/ui/desk-notice";

const FleetPage = () => {
  const fleet = useAdminFleet();

  return (
    <div className="flex flex-col gap-5">
      {fleet.notice ? (
        <DeskNotice
          onDismiss={() => fleet.setNotice(null)}
          dismissLabel={fleet.t("Dashboard.Fleet.dismiss")}
        >
          {fleet.notice}
        </DeskNotice>
      ) : null}

      {fleet.loadError ? (
        <DeskNotice
          variant="error"
          onRetry={() => void fleet.fetchVehicles()}
          retryLabel={fleet.t("Dashboard.Home.try-again")}
        >
          {fleet.loadError}
        </DeskNotice>
      ) : null}

      <FleetPageHeader
        t={fleet.t}
        showForm={fleet.showForm}
        setShowForm={fleet.setShowForm}
        editingId={fleet.editingId}
        resetForm={fleet.resetForm}
        formData={fleet.formData}
        setFormData={fleet.setFormData}
        handleSubmit={fleet.handleSubmit}
        isLoading={fleet.isLoading}
        vehicleCount={fleet.vehicles.length}
        filters={
          <FleetPageFilters
            t={fleet.t}
            searchQuery={fleet.searchQuery}
            setSearchQuery={fleet.setSearchQuery}
            categoryFilter={fleet.categoryFilter}
            setCategoryFilter={fleet.setCategoryFilter}
            statusFilter={fleet.statusFilter}
            setStatusFilter={fleet.setStatusFilter}
            vehicleCount={fleet.vehicles.length}
            filteredCount={fleet.filteredVehicles.length}
          />
        }
      />

      <FleetPageGrid
        t={fleet.t}
        isLoading={fleet.isLoading}
        vehicles={fleet.vehicles}
        filteredVehicles={fleet.filteredVehicles}
        handleEdit={fleet.handleEdit}
        handleDelete={fleet.handleDelete}
        resolveImageSrc={fleet.resolveImageSrc}
        setShowForm={fleet.setShowForm}
      />

      <DeskConfirmDialog
        open={Boolean(fleet.pendingDeleteId)}
        title={fleet.t(
          "Dashboard.Fleet.are-you-sure-you-want-to-delete-this-vehicle"
        )}
        description={fleet.t(
          "Dashboard.Fleet.are-you-sure-you-want-to-delete-this-vehicle"
        )}
        confirmLabel={fleet.t("FormBuilder.ui.delete")}
        cancelLabel={fleet.t("Dashboard.Fleet.cancel")}
        pending={fleet.isLoading}
        onConfirm={fleet.confirmDelete}
        onOpenChange={(open) => {
          if (!open) fleet.setPendingDeleteId(null);
        }}
      />
    </div>
  );
};

export default FleetPage;
