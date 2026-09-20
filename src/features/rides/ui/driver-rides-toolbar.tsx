"use client";

import { Button } from "@/shared/ui/button";
import { DateRangePicker } from "@/shared/ui/date-range-picker";
import { Input } from "@/shared/ui/input";
import type { useDriverDashboard } from "@/features/drivers/hooks/useDriverDashboard";
import { Filter, RefreshCw, Search } from "lucide-react";

type DriverDashboardState = ReturnType<typeof useDriverDashboard>;

export function DriverRidesToolbar({
  t,
  isLoading,
  fetchAssignedRides,
  showFilters,
  setShowFilters,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
}: Pick<
  DriverDashboardState,
  | "t"
  | "isLoading"
  | "fetchAssignedRides"
  | "showFilters"
  | "setShowFilters"
  | "searchQuery"
  | "setSearchQuery"
  | "dateRange"
  | "setDateRange"
>) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("Sidebar.my_assignments")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Dashboard.Rides.Description")}
          </p>
        </div>
        <Button
          onClick={fetchAssignedRides}
          variant="outline"
          className="h-11"
          disabled={isLoading}
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          {t("Dashboard.Rides.Refresh")}
        </Button>
      </div>
      <div className="desk-card space-y-3 rounded-md border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{t("Dashboard.Rides.FilterBookings")}</p>
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-4" />
            {showFilters
              ? t("Dashboard.Rides.HideFilters")
              : t("Dashboard.Rides.ShowFilters")}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("Dashboard.Rides.SearchPlaceholder")}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-11 ps-10"
          />
        </div>
        {showFilters ? (
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        ) : null}
      </div>
    </div>
  );
}
