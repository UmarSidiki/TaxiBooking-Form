"use client";

import type { useAdminFleet } from "@/features/fleet/hooks/useAdminFleet";
import {
  DeskFilterBar,
  deskControlClassName,
  deskSearchInputClassName,
} from "@/features/dashboard/ui/desk-toolbar";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
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
    <DeskFilterBar>
      <div className="relative min-w-0 flex-1">
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
          className={deskSearchInputClassName}
        />
      </div>

      <div className="hidden shrink-0 items-center text-muted-foreground/50 sm:flex">
        <SlidersHorizontal className="size-3.5" aria-hidden="true" />
      </div>

      <div className="flex items-center gap-2">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger
            id="fleet-category-filter"
            className={cn(deskControlClassName, "w-full sm:w-38")}
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
            className={cn(deskControlClassName, "w-full sm:w-32")}
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

      {isFiltered ? (
        <span
          className="shrink-0 text-end text-xs tabular-nums text-muted-foreground sm:ms-auto"
          aria-live="polite"
        >
          {filteredCount} / {vehicleCount}
        </span>
      ) : null}
    </DeskFilterBar>
  );
}
