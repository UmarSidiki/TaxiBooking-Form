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
import { Car, CreditCard, Filter, RefreshCw, Search } from "lucide-react";

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
              onClick={fetchBookings}
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
        <Card className="p-4 border border-gray-200 shadow-sm bg-white">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-secondary-foreground" />
                {t("Dashboard.Rides.FilterBookings")}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 text-secondary-foreground w-full sm:w-auto"
              >
                <Filter className="w-4 h-4" />
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
                className="w-full pl-10 h-10"
              />
            </div>

            {showFilters && (
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 pt-2">
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  className="flex-1 sm:w-auto"
                />

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="flex-1 sm:w-48">
                    <CreditCard className="w-4 h-4 mr-2" />
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
                    <Filter className="w-4 h-4 mr-2" />
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
