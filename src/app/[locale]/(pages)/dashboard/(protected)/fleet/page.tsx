"use client";

import { FleetPageFilters } from "@/features/fleet/ui/fleet-page-filters";
import { FleetPageGrid } from "@/features/fleet/ui/fleet-page-grid";
import { FleetPageHeader } from "@/features/fleet/ui/fleet-page-header";
import { useAdminFleet } from "@/features/fleet/hooks/useAdminFleet";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";

const FleetPage = () => {
  const fleet = useAdminFleet();

  return (
    <div className="space-y-6">
      {fleet.notice ? (
        <p
          className="rounded-md border border-border bg-card px-4 py-3 text-sm"
          role="status"
        >
          {fleet.notice}
          <button
            type="button"
            className="ms-3 min-h-11 rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => fleet.setNotice(null)}
          >
            {fleet.t("Dashboard.Fleet.dismiss")}
          </button>
        </p>
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
      />

      {fleet.loadError ? (
        <p className="rounded-md border border-destructive/40 bg-card px-4 py-3 text-sm" role="alert">
          {fleet.loadError}
          <button
            type="button"
            className="ms-3 min-h-11 rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => void fleet.fetchVehicles()}
          >
            {fleet.t("Dashboard.Home.try-again")}
          </button>
        </p>
      ) : null}

      <FleetPageFilters
        t={fleet.t}
        searchQuery={fleet.searchQuery}
        setSearchQuery={fleet.setSearchQuery}
        categoryFilter={fleet.categoryFilter}
        setCategoryFilter={fleet.setCategoryFilter}
        statusFilter={fleet.statusFilter}
        setStatusFilter={fleet.setStatusFilter}
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
        title={fleet.t("Dashboard.Fleet.are-you-sure-you-want-to-delete-this-vehicle")}
        description={fleet.t("Dashboard.Fleet.are-you-sure-you-want-to-delete-this-vehicle")}
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
