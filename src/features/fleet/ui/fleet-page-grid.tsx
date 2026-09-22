"use client";

import { FleetVehicleCard } from "@/features/fleet/ui/fleet-vehicle-card";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import type { useAdminFleet } from "@/features/fleet/hooks/useAdminFleet";
import { Car, Plus } from "lucide-react";

type AdminFleetState = ReturnType<typeof useAdminFleet>;

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status">
        <span className="sr-only">{t("Dashboard.Fleet.fleet-management")}…</span>
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className="desk-card gap-4 border-border p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="aspect-[16/9] animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredVehicles.length === 0 ? (
        <div className="col-span-full">
          <Card className="desk-card border-border bg-card">
            <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
                <Car className="size-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {vehicles.length === 0
                  ? t("Dashboard.Fleet.no-vehicles-yet")
                  : t("Dashboard.Fleet.no-vehicles-match-your-filters")}
              </h3>
              <p className="mb-5 max-w-md text-sm text-muted-foreground">
                {vehicles.length === 0
                  ? t(
                      "Dashboard.Fleet.get-started-by-adding-your-first-vehicle-to-the-fleet"
                    )
                  : t(
                      "Dashboard.Fleet.try-adjusting-your-search-or-filter-criteria"
                    )}
              </p>
              {vehicles.length === 0 ? (
                <Button
                  onClick={() => setShowForm(true)}
                  className="min-h-11"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t("Dashboard.Fleet.add-your-first-vehicle")}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : (
        filteredVehicles.map((vehicle) => (
          <FleetVehicleCard
            key={vehicle._id}
            vehicle={vehicle}
            onEdit={handleEdit}
            onDelete={handleDelete}
            resolveImageSrc={resolveImageSrc}
          />
        ))
      )}
    </div>
  );
}
