"use client";

import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import {
  DeskFilterBar,
  DeskToolbar,
  deskControlClassName,
  deskSearchInputClassName,
} from "@/features/dashboard/ui/desk-toolbar";
import { Button } from "@/shared/ui/button";
import { DateRangePicker } from "@/shared/ui/date-range-picker";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { useAdminRides } from "@/features/rides/hooks/useAdminRides";
import { useTheme } from "@/features/settings/context/theme-context";
import { cn } from "@/shared/lib/utils";
import { Plus, RefreshCw, Search, SlidersHorizontal } from "lucide-react";

type Rides = ReturnType<typeof useAdminRides>;

export function AdminRidesToolbar({
  t,
  isLoading,
  fetchBookings,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  paymentFilter,
  setPaymentFilter,
  sortBy,
  setSortBy,
  onNewBooking,
}: Pick<
  Rides,
  | "t"
  | "isLoading"
  | "fetchBookings"
  | "searchQuery"
  | "setSearchQuery"
  | "dateRange"
  | "setDateRange"
  | "paymentFilter"
  | "setPaymentFilter"
  | "sortBy"
  | "setSortBy"
> & { onNewBooking: () => void }) {
  const { settings } = useTheme();
  const deskBookingEnabled = settings?.enableDeskBooking ?? false;

  return (
    <>
      <DeskPageMeta
        title={t("Dashboard.Rides.Title")}
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
              name="ride-search"
              type="search"
              autoComplete="off"
              aria-label={t("Dashboard.Rides.SearchPlaceholder")}
              placeholder={t("Dashboard.Rides.SearchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={deskSearchInputClassName}
            />
          </div>

          <div className="hidden shrink-0 items-center text-muted-foreground/50 sm:flex">
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              className="w-full sm:w-auto"
            />
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger
                className={cn(deskControlClassName, "w-full sm:w-36")}
                aria-label={t("Dashboard.Rides.Payment")}
              >
                <SelectValue placeholder={t("Dashboard.Rides.Payment")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Dashboard.Rides.AllPayments")}</SelectItem>
                <SelectItem value="completed">{t("Dashboard.Rides.Paid")}</SelectItem>
                <SelectItem value="pending">{t("Dashboard.Rides.Pending")}</SelectItem>
                <SelectItem value="failed">{t("Dashboard.Rides.Failed")}</SelectItem>
                <SelectItem value="refunded">{t("Dashboard.Rides.Refunded")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                className={cn(deskControlClassName, "w-full sm:w-40")}
                aria-label={t("Dashboard.Rides.sort-by")}
              >
                <SelectValue placeholder={t("Dashboard.Rides.sort-by")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-asc">{t("Dashboard.Rides.nearest-date")}</SelectItem>
                <SelectItem value="date-desc">{t("Dashboard.Rides.furthest-date")}</SelectItem>
                <SelectItem value="price-asc">{t("Dashboard.Rides.lowest-price")}</SelectItem>
                <SelectItem value="price-desc">{t("Dashboard.Rides.highest-price")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DeskFilterBar>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row xl:w-auto">
          {deskBookingEnabled ? (
            <Button
              onClick={onNewBooking}
              className="h-10 w-full rounded-xl px-4 font-semibold sm:w-auto"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("Dashboard.Rides.new-booking")}
            </Button>
          ) : null}
          <Button
            onClick={fetchBookings}
            variant="outline"
            disabled={isLoading}
            className="h-10 w-full rounded-xl px-4 font-semibold sm:w-auto"
          >
            <RefreshCw
              className={cn("size-4", isLoading && "animate-spin")}
              aria-hidden="true"
            />
            {t("Dashboard.Rides.Refresh")}
          </Button>
        </div>
      </DeskToolbar>
    </>
  );
}
