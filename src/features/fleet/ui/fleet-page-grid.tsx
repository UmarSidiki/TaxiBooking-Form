"use client";

import { FleetVehicleCard } from "@/features/fleet/ui/fleet-vehicle-card";
import { Button } from "@/shared/ui/button";
import type { useAdminFleet } from "@/features/fleet/hooks/useAdminFleet";
import { Car, Plus } from "lucide-react";

type AdminFleetState = ReturnType<typeof useAdminFleet>;

function SkeletonCard() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border border-border/60 bg-card"
      aria-hidden="true"
    >
      {/* Photo placeholder */}
      <div className="aspect-[16/9] w-full bg-muted/60" />
      {/* Stats placeholder */}
      <div className="px-4 py-3 space-y-3">
        <div className="h-3 w-3/4 rounded-full bg-muted" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-3 rounded-full bg-muted" />
          <div className="h-3 rounded-full bg-muted" />
          <div className="h-3 rounded-full bg-muted" />
          <div className="h-3 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function FleetPageGrid({
  t,
  isLoading,
  vehicles,
  filteredVehicles,
  handleEdit,
  handleDelete,
  resolveImageSrc,
  setShowForm,
}: Pick<
  AdminFleetState,
  | "t"
  | "isLoading"
  | "vehicles"
  | "filteredVehicles"
  | "handleEdit"
  | "handleDelete"
  | "resolveImageSrc"
  | "setShowForm"
>) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="status"
        aria-label={`${t("Dashboard.Fleet.fleet-management")}…`}
      >
        <span className="sr-only">{t("Dashboard.Fleet.fleet-management")}…</span>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (filteredVehicles.length === 0) {
    return (
      <div className="desk-card flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted shadow-inner">
          <Car className="size-7 text-muted-foreground/60" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {vehicles.length === 0
              ? t("Dashboard.Fleet.no-vehicles-yet")
              : t("Dashboard.Fleet.no-vehicles-match-your-filters")}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {vehicles.length === 0
              ? t("Dashboard.Fleet.get-started-by-adding-your-first-vehicle-to-the-fleet")
              : t("Dashboard.Fleet.try-adjusting-your-search-or-filter-criteria")}
          </p>
        </div>
        {vehicles.length === 0 && (
          <Button
            onClick={() => setShowForm(true)}
            className="mt-1 h-10 rounded-xl gap-1.5 px-5"
            id="fleet-add-first-vehicle"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("Dashboard.Fleet.add-your-first-vehicle")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredVehicles.map((vehicle) => (
        <FleetVehicleCard
          key={vehicle._id}
          vehicle={vehicle}
          onEdit={handleEdit}
          onDelete={handleDelete}
          resolveImageSrc={resolveImageSrc}
        />
      ))}
    </div>
  );
}
