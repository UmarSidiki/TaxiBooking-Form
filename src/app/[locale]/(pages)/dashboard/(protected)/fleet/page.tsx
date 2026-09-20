"use client";

import { FleetPageFilters } from "@/features/fleet/ui/fleet-page-filters";
import { FleetPageGrid } from "@/features/fleet/ui/fleet-page-grid";
import { FleetPageHeader } from "@/features/fleet/ui/fleet-page-header";
import { useAdminFleet } from "@/features/fleet/hooks/useAdminFleet";

const FleetPage = () => {
  const fleet = useAdminFleet();

  return (
    <div className="space-y-6">
      {/* Header Section */}
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

      {/* Search and Filter Controls */}
      <FleetPageFilters
        t={fleet.t}
        searchQuery={fleet.searchQuery}
        setSearchQuery={fleet.setSearchQuery}
        categoryFilter={fleet.categoryFilter}
        setCategoryFilter={fleet.setCategoryFilter}
        statusFilter={fleet.statusFilter}
        setStatusFilter={fleet.setStatusFilter}
      />

      {/* Vehicle Grid */}
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
    </div>
  );
};

export default FleetPage;
