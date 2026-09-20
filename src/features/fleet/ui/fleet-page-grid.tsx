"use client";

import { FleetVehicleCard } from "@/components/fleet/fleet-vehicle-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { useAdminFleet } from "@/hooks/fleet/useAdminFleet";
import { Car, Loader2, Plus } from "lucide-react";

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
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {filteredVehicles.length === 0 ? (
        <div className="col-span-full">
          <Card className="border-2 border-dashed border-border bg-card">
            <CardContent className="p-8 sm:p-12 text-center">
              <Car className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {vehicles.length === 0
                  ? t("Dashboard.Fleet.no-vehicles-yet")
                  : t("Dashboard.Fleet.no-vehicles-match-your-filters")}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                {vehicles.length === 0
                  ? t(
                      "Dashboard.Fleet.get-started-by-adding-your-first-vehicle-to-the-fleet"
                    )
                  : t(
                      "Dashboard.Fleet.try-adjusting-your-search-or-filter-criteria"
                    )}
              </p>
              {vehicles.length === 0 && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("Dashboard.Fleet.add-your-first-vehicle")}{" "}
                </Button>
              )}
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
