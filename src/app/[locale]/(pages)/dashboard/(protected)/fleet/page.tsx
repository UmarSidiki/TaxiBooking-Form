"use client";

import { FleetPageFilters } from "@/features/fleet/ui/fleet-page-filters";
import { FleetPageGrid } from "@/features/fleet/ui/fleet-page-grid";
import { FleetPageHeader } from "@/features/fleet/ui/fleet-page-header";
import { useAdminFleet } from "@/features/fleet/hooks/useAdminFleet";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

const FleetPage = () => {
  const fleet = useAdminFleet();

  return (
    <div className="space-y-6">
      {/* ── Success / error notices ───────────────────── */}
      {fleet.notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300"
        >
          <CheckCircle className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{fleet.notice}</span>
          <button
            type="button"
            className="rounded-md px-2 py-0.5 text-xs font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => fleet.setNotice(null)}
          >
            {fleet.t("Dashboard.Fleet.dismiss")}
          </button>
        </div>
      )}

      {fleet.loadError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{fleet.loadError}</span>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => void fleet.fetchVehicles()}
          >
            <RefreshCw className="size-3" aria-hidden="true" />
            {fleet.t("Dashboard.Home.try-again")}
          </button>
        </div>
      )}

      {/* ── Header + Add button ───────────────────────── */}
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
      />

      {/* ── Filters ──────────────────────────────────── */}
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

      {/* ── Grid ─────────────────────────────────────── */}
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

      {/* ── Delete confirm ───────────────────────────── */}
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
