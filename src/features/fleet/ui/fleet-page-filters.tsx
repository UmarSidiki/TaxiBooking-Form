"use client";

import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { useAdminFleet } from "@/features/fleet/hooks/useAdminFleet";
import { Search, SlidersHorizontal } from "lucide-react";

type AdminFleetState = ReturnType<typeof useAdminFleet>;

export function FleetPageFilters({
  t,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  vehicleCount,
  filteredCount,
}: Pick<
  AdminFleetState,
  | "t"
  | "searchQuery"
  | "setSearchQuery"
  | "categoryFilter"
  | "setCategoryFilter"
  | "statusFilter"
  | "setStatusFilter"
> & {
  vehicleCount: number;
  filteredCount: number;
}) {
  const isFiltered =
    searchQuery !== "" || categoryFilter !== "all" || statusFilter !== "all";

  return (
    <div className="desk-card rounded-2xl border border-border/60 bg-card px-4 py-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="fleet-search"
            name="fleet-search"
            type="search"
            autoComplete="off"
            aria-label={t(
              "Dashboard.Fleet.search-vehicles-by-name-description-or-category"
            )}
            placeholder={t(
              "Dashboard.Fleet.search-vehicles-by-name-description-or-category"
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-xl bg-muted/40 border-border/50 ps-10 placeholder:text-muted-foreground/60 focus-visible:bg-background transition-colors"
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground/50">
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              id="fleet-category-filter"
              className="h-10 w-full sm:w-38 rounded-xl bg-muted/40 border-border/50 text-sm"
            >
              <SelectValue placeholder={t("Dashboard.Fleet.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Dashboard.Fleet.all-categories")}</SelectItem>
              <SelectItem value="economy">{t("Dashboard.Fleet.economy")}</SelectItem>
              <SelectItem value="comfort">{t("Dashboard.Fleet.comfort")}</SelectItem>
              <SelectItem value="business">{t("Dashboard.Fleet.business")}</SelectItem>
              <SelectItem value="van">{t("Dashboard.Fleet.van")}</SelectItem>
              <SelectItem value="luxury">{t("Dashboard.Fleet.luxury")}</SelectItem>
              <SelectItem value="suv">{t("Dashboard.Fleet.suv")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              id="fleet-status-filter"
              className="h-10 w-full sm:w-32 rounded-xl bg-muted/40 border-border/50 text-sm"
            >
              <SelectValue placeholder={t("Dashboard.Fleet.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Dashboard.Fleet.all-status")}</SelectItem>
              <SelectItem value="active">{t("Dashboard.Fleet.active")}</SelectItem>
              <SelectItem value="inactive">{t("Dashboard.Fleet.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Result count */}
        {isFiltered && (
          <span
            className="shrink-0 text-xs text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            {filteredCount} / {vehicleCount}
          </span>
        )}
      </div>
    </div>
  );
}
