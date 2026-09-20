"use client";

import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { DateRangePicker } from "@/shared/ui/date-range-picker";
import { Input } from "@/shared/ui/input";
import type { useDriverDashboard } from "@/features/drivers/hooks/useDriverDashboard";
import { Car, Filter, RefreshCw, Search } from "lucide-react";

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
    <>
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="w-8 h-8 text-primary" />
              {t("Dashboard.Rides.Title")}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("Dashboard.Rides.Description")}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={fetchAssignedRides}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {t("Dashboard.Rides.Refresh")}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-3 sm:p-4 border border-gray-200 shadow-sm bg-white">
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-foreground" />
                {t("Dashboard.Rides.FilterBookings")}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-secondary-foreground text-sm"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                {showFilters
                  ? t("Dashboard.Rides.HideFilters")
                  : t("Dashboard.Rides.ShowFilters")}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-foreground w-4 h-4" />
              <Input
                placeholder={t("Dashboard.Rides.SearchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 sm:h-10 text-sm"
              />
            </div>

            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  className="flex-1 sm:w-auto"
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
