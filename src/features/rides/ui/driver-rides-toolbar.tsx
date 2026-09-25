"use client";

import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import {
  DeskFilterBar,
  DeskToolbar,
  deskSearchInputClassName,
} from "@/features/dashboard/ui/desk-toolbar";
import { Button } from "@/shared/ui/button";
import { DateRangePicker } from "@/shared/ui/date-range-picker";
import { Input } from "@/shared/ui/input";
import type { useDriverDashboard } from "@/features/drivers/hooks/useDriverDashboard";
import { cn } from "@/shared/lib/utils";
import { RefreshCw, Search } from "lucide-react";

type DriverDashboardState = ReturnType<typeof useDriverDashboard>;

export function DriverRidesToolbar({
  t,
  isLoading,
  fetchAssignedRides,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
}: Pick<
  DriverDashboardState,
  | "t"
  | "isLoading"
  | "fetchAssignedRides"
  | "searchQuery"
  | "setSearchQuery"
  | "dateRange"
  | "setDateRange"
>) {
  return (
    <div className="flex flex-col gap-3">
      <DeskPageMeta
        title={t("Sidebar.my_assignments")}
        description={t("Dashboard.Rides.Description")}
      />
      <DeskToolbar>
        <DeskFilterBar>
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder={t("Dashboard.Rides.SearchPlaceholder")}
              aria-label={t("Dashboard.Rides.SearchPlaceholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={deskSearchInputClassName}
            />
          </div>
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            className="w-full sm:w-auto"
          />
        </DeskFilterBar>
        <Button
          onClick={fetchAssignedRides}
          variant="outline"
          className="h-10 w-full shrink-0 rounded-xl px-4 font-semibold xl:w-auto"
          disabled={isLoading}
        >
          <RefreshCw
            className={cn("size-4", isLoading && "animate-spin")}
            aria-hidden="true"
          />
          {t("Dashboard.Rides.Refresh")}
        </Button>
      </DeskToolbar>
    </div>
  );
}
