"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { useAdminFleet } from "@/hooks/fleet/useAdminFleet";
import { Search } from "lucide-react";

type AdminFleetState = ReturnType<typeof useAdminFleet>;

export function FleetPageFilters({
  t,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
}: Pick<
  AdminFleetState,
  | "t"
  | "searchQuery"
  | "setSearchQuery"
  | "categoryFilter"
  | "setCategoryFilter"
  | "statusFilter"
  | "setStatusFilter"
>) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t(
                  "Dashboard.Fleet.search-vehicles-by-name-description-or-category"
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 sm:h-9"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40 h-10 sm:h-9">
                <SelectValue placeholder={t("Dashboard.Fleet.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("Dashboard.Fleet.all-categories")}
                </SelectItem>
                <SelectItem value="economy">
                  {t("Dashboard.Fleet.economy")}
                </SelectItem>
                <SelectItem value="comfort">
                  {t("Dashboard.Fleet.comfort")}
                </SelectItem>
                <SelectItem value="business">
                  {t("Dashboard.Fleet.business")}
                </SelectItem>
                <SelectItem value="van">
                  {t("Dashboard.Fleet.van")}
                </SelectItem>
                <SelectItem value="luxury">
                  {t("Dashboard.Fleet.luxury")}
                </SelectItem>
                <SelectItem value="suv">
                  {t("Dashboard.Fleet.suv")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32 h-10 sm:h-9">
                <SelectValue placeholder={t("Dashboard.Fleet.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("Dashboard.Fleet.all-status")}
                </SelectItem>
                <SelectItem value="active">
                  {t("Dashboard.Fleet.active")}
                </SelectItem>
                <SelectItem value="inactive">
                  {t("Dashboard.Fleet.inactive")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
