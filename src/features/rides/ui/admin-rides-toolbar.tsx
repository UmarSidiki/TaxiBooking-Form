"use client";

import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { DateRangePicker } from "@/shared/ui/date-range-picker";
import type { useAdminRides } from "@/features/rides/hooks/useAdminRides";
import { CreditCard, Filter, RefreshCw, Search } from "lucide-react";

type Rides = ReturnType<typeof useAdminRides>;

export function AdminRidesToolbar({
  t,
  isLoading,
  fetchBookings,
  showFilters,
  setShowFilters,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  paymentFilter,
  setPaymentFilter,
  sortBy,
  setSortBy,
}: Pick<
  Rides,
  | "t"
  | "isLoading"
  | "fetchBookings"
  | "showFilters"
  | "setShowFilters"
  | "searchQuery"
  | "setSearchQuery"
  | "dateRange"
  | "setDateRange"
  | "paymentFilter"
  | "setPaymentFilter"
  | "sortBy"
  | "setSortBy"
>) {
  return (
    <>
      <div>
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
              {t("Dashboard.Rides.Title")}
            </h1>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              {t("Dashboard.Rides.Description")}
            </p>
          </div>
          <Button
            onClick={fetchBookings}
            variant="outline"
            disabled={isLoading}
            className="min-h-11"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {t("Dashboard.Rides.Refresh")}
          </Button>
        </div>

        <Card className="desk-card gap-4 border-border p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Filter className="size-5 text-secondary-foreground" aria-hidden="true" />
                {t("Dashboard.Rides.FilterBookings")}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="min-h-11 text-secondary-foreground"
                aria-expanded={showFilters}
                aria-controls="ride-advanced-filters"
              >
                <Filter className="size-4" aria-hidden="true" />
                {showFilters
                  ? t("Dashboard.Rides.HideFilters")
                  : t("Dashboard.Rides.ShowFilters")}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                name="ride-search"
                type="search"
                autoComplete="off"
                aria-label={t("Dashboard.Rides.SearchPlaceholder")}
                placeholder={t("Dashboard.Rides.SearchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full ps-10"
              />
            </div>

            {showFilters && (
              <div
                id="ride-advanced-filters"
                className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap"
              >
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  className="flex-1 sm:w-auto"
                />

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="flex-1 sm:w-48">
                    <CreditCard className="me-2 size-4" aria-hidden="true" />
                    <SelectValue placeholder={t("Dashboard.Rides.Payment")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("Dashboard.Rides.AllPayments")}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("Dashboard.Rides.Paid")}
                    </SelectItem>
                    <SelectItem value="pending">
                      {t("Dashboard.Rides.Pending")}
                    </SelectItem>
                    <SelectItem value="failed">
                      {t("Dashboard.Rides.Failed")}
                    </SelectItem>
                    <SelectItem value="refunded">
                      {t("Dashboard.Rides.Refunded")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1 sm:w-48">
                    <Filter className="me-2 size-4" aria-hidden="true" />
                    <SelectValue placeholder={t("Dashboard.Rides.sort-by")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-asc">
                      {t("Dashboard.Rides.nearest-date")}
                    </SelectItem>
                    <SelectItem value="date-desc">
                      {t("Dashboard.Rides.furthest-date")}
                    </SelectItem>
                    <SelectItem value="price-asc">
                      {t("Dashboard.Rides.lowest-price")}
                    </SelectItem>
                    <SelectItem value="price-desc">
                      {t("Dashboard.Rides.highest-price")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
