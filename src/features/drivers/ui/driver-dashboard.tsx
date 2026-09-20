"use client";

import { DriverRideCard } from "@/features/rides/ui/driver-ride-card";
import { DriverRideDetailDialog } from "@/features/rides/ui/driver-ride-detail-dialog";
import { DriverRidesToolbar } from "@/features/rides/ui/driver-rides-toolbar";
import { AdminRidesTabPanel } from "@/features/rides/ui/admin-rides-tab-panel";
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
  } = rides;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("Dashboard.Rides.LoadingRides")}
        </h3>
        <p className="text-gray-500">
          {t("Dashboard.Rides.LoadingRidesDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DriverRidesToolbar
        t={rides.t}
        isLoading={rides.isLoading}
        fetchAssignedRides={rides.fetchAssignedRides}
        showFilters={rides.showFilters}
        setShowFilters={rides.setShowFilters}
        searchQuery={rides.searchQuery}
        setSearchQuery={rides.setSearchQuery}
        dateRange={rides.dateRange}
        setDateRange={rides.setDateRange}
      />

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-background p-1 rounded-lg border border-border shadow-sm h-auto">
          <TabsTrigger
            value="upcoming"
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-medium text-center">
              {t("Dashboard.Rides.UpcomingRides")}
            </span>
            {filteredBookings.length > 0 && activeTab === "upcoming" && (
              <Badge
                variant="secondary"
                className="ml-0 sm:ml-1 bg-primary/20 text-primary text-xs"
              >
                {filteredBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="passed"
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md transition-all data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-medium text-center">
              {t("Dashboard.Rides.CompletedRides")}
            </span>
            {filteredBookings.length > 0 && activeTab === "passed" && (
              <Badge
                variant="secondary"
                className="ml-0 sm:ml-1 bg-secondary/20 text-secondary-foreground text-xs"
              >
                {filteredBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="canceled"
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md transition-all data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-medium text-center">
              {t("Dashboard.Rides.CanceledRides")}
            </span>
            {filteredBookings.length > 0 && activeTab === "canceled" && (
              <Badge
                variant="secondary"
                className="ml-0 sm:ml-1 bg-destructive/20 text-destructive text-xs"
              >
                {filteredBookings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <AdminRidesTabPanel
          value="upcoming"
          isLoading={isLoading}
          isEmpty={filteredBookings.length === 0}
          fetchBookings={fetchAssignedRides}
          t={t}
          loadingWrapClass="bg-primary/10"
          loadingIconClass="text-primary"
          emptyIcon={CalendarDays}
          emptyTitle={t("Dashboard.Rides.NoUpcomingRides")}
          emptyDescription={t("Dashboard.Rides.NoUpcomingRidesDescription")}
          gridClassName="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4"
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

        <AdminRidesTabPanel
          value="passed"
          isLoading={isLoading}
          isEmpty={filteredBookings.length === 0}
          fetchBookings={fetchAssignedRides}
          t={t}
          loadingWrapClass="bg-secondary/10"
          loadingIconClass="text-secondary-foreground"
          emptyIcon={CheckCircle}
          emptyTitle={t("Dashboard.Rides.NoCompletedRides")}
          emptyDescription={t("Dashboard.Rides.NoCompletedRidesDescription")}
          gridClassName="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4"
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

        <AdminRidesTabPanel
          value="canceled"
          isLoading={isLoading}
          isEmpty={filteredBookings.length === 0}
          fetchBookings={fetchAssignedRides}
          t={t}
          loadingWrapClass="bg-destructive/10"
          loadingIconClass="text-destructive"
          emptyIcon={Ban}
          emptyTitle={t("Dashboard.Rides.NoCanceledRides")}
          emptyDescription={t("Dashboard.Rides.NoCanceledRidesDescription")}
          gridClassName="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4"
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
