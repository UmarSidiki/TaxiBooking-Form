"use client";

import { DriverRideCard } from "@/features/rides/ui/driver-ride-card";
import { DriverRideDetailDialog } from "@/features/rides/ui/driver-ride-detail-dialog";
import { DriverRidesToolbar } from "@/features/rides/ui/driver-rides-toolbar";
import { AdminRidesTabPanel } from "@/features/rides/ui/admin-rides-tab-panel";
import { DeskNotice } from "@/features/dashboard/ui/desk-notice";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useDriverDashboard } from "@/features/drivers/hooks/useDriverDashboard";
import { Ban, CalendarDays, CheckCircle, Loader2 } from "lucide-react";

export default function DriverDashboard() {
  const rides = useDriverDashboard();
  const {
    t,
    currencySymbol,
    filteredBookings,
    isLoading,
    activeTab,
    setActiveTab,
    setDetailBooking,
    fetchAssignedRides,
    isBookingPassed,
    loadError,
  } = rides;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mb-4 size-8 animate-spin text-primary" />
        <p className="text-sm">{t("Dashboard.Rides.LoadingRides")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <DriverRidesToolbar
        t={rides.t}
        isLoading={rides.isLoading}
        fetchAssignedRides={rides.fetchAssignedRides}
        searchQuery={rides.searchQuery}
        setSearchQuery={rides.setSearchQuery}
        dateRange={rides.dateRange}
        setDateRange={rides.setDateRange}
      />
      {loadError ? (
        <DeskNotice
          variant="error"
          onRetry={() => void fetchAssignedRides()}
          retryLabel={t("Drivers.retry")}
        >
          {loadError}
        </DeskNotice>
      ) : null}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted p-1">
          <TabsTrigger value="upcoming" className="min-h-11 gap-2 text-xs sm:text-sm">
            <CalendarDays className="size-4" />
            {t("Dashboard.Rides.UpcomingRides")}
            {filteredBookings.length > 0 && activeTab === "upcoming" ? (
              <Badge variant="secondary">{filteredBookings.length}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="passed" className="min-h-11 gap-2 text-xs sm:text-sm">
            <CheckCircle className="size-4" />
            {t("Dashboard.Rides.CompletedRides")}
          </TabsTrigger>
          <TabsTrigger value="canceled" className="min-h-11 gap-2 text-xs sm:text-sm">
            <Ban className="size-4" />
            {t("Dashboard.Rides.CanceledRides")}
          </TabsTrigger>
        </TabsList>
        {(["upcoming", "passed", "canceled"] as const).map((value) => (
          <AdminRidesTabPanel
            key={value}
            value={value}
            isLoading={isLoading}
            isEmpty={filteredBookings.length === 0}
            fetchBookings={fetchAssignedRides}
            t={t}
            emptyIcon={
              value === "canceled"
                ? Ban
                : value === "passed"
                  ? CheckCircle
                  : CalendarDays
            }
            emptyTitle={
              value === "upcoming"
                ? t("Dashboard.Rides.NoUpcomingRides")
                : value === "passed"
                  ? t("Dashboard.Rides.NoCompletedRides")
                  : t("Dashboard.Rides.NoCanceledRides")
            }
            emptyDescription={
              value === "upcoming"
                ? t("Dashboard.Rides.NoUpcomingRidesDescription")
                : value === "passed"
                  ? t("Dashboard.Rides.NoCompletedRidesDescription")
                  : t("Dashboard.Rides.NoCanceledRidesDescription")
            }
            gridClassName="grid grid-cols-1 gap-4 xl:grid-cols-2"
          >
            {filteredBookings.map((booking) => (
              <DriverRideCard
                key={booking._id?.toString()}
                booking={booking}
                t={t}
                currencySymbol={currencySymbol}
                isBookingPassed={isBookingPassed}
                setDetailBooking={setDetailBooking}
              />
            ))}
          </AdminRidesTabPanel>
        ))}
      </Tabs>
      <DriverRideDetailDialog
        t={rides.t}
        currencySymbol={rides.currencySymbol}
        detailBooking={rides.detailBooking}
        setDetailBooking={rides.setDetailBooking}
        isBookingPassed={rides.isBookingPassed}
      />
    </div>
  );
}
