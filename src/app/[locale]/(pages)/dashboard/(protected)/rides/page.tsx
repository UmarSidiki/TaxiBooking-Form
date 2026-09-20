"use client";

import { AdminRideCancelDialog } from "@/features/rides/ui/admin-ride-cancel-dialog";
import { AdminRideCardList } from "@/features/rides/ui/admin-ride-card-list";
import { AdminRideDetailDialog } from "@/features/rides/ui/admin-ride-detail-dialog";
import { AdminRidesTabPanel } from "@/features/rides/ui/admin-rides-tab-panel";
import { AdminRidesToolbar } from "@/features/rides/ui/admin-rides-toolbar";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useAdminRides } from "@/features/rides/hooks/useAdminRides";
import { Ban, CalendarDays, CheckCircle } from "lucide-react";

export default function RidesPage() {
  const rides = useAdminRides();
  const {
    t,
    filteredBookings,
    isLoading,
    loadError,
    activeTab,
    setActiveTab,
    fetchBookings,
    notice,
    setNotice,
  } = rides;

  return (
    <div className="space-y-6">
      <AdminRidesToolbar
        t={rides.t}
        isLoading={rides.isLoading}
        fetchBookings={rides.fetchBookings}
        showFilters={rides.showFilters}
        setShowFilters={rides.setShowFilters}
        searchQuery={rides.searchQuery}
        setSearchQuery={rides.setSearchQuery}
        dateRange={rides.dateRange}
        setDateRange={rides.setDateRange}
        paymentFilter={rides.paymentFilter}
        setPaymentFilter={rides.setPaymentFilter}
        sortBy={rides.sortBy}
        setSortBy={rides.setSortBy}
      />

      {loadError ? (
        <p
          className="rounded-md border border-border bg-card px-4 py-3 text-sm"
          role="alert"
        >
          {loadError}
          <button
            type="button"
            className="ms-3 text-primary underline-offset-4 hover:underline"
            onClick={() => void fetchBookings()}
          >
            {t("Dashboard.Home.try-again")}
          </button>
        </p>
      ) : null}

      {notice ? (
        <p
          className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground"
          role="status"
        >
          {notice}
          <button
            type="button"
            className="ms-3 text-primary underline-offset-4 hover:underline"
            onClick={() => setNotice(null)}
          >
            {t("Dashboard.Rides.Dismiss")}
          </button>
        </p>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex h-auto w-full flex-col gap-2 overflow-x-auto rounded-md border border-border bg-muted p-1 sm:flex-row">
          <TabsTrigger
            value="upcoming"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <CalendarDays className="w-4 h-4" />
            <span className="font-medium">
              {t("Dashboard.Rides.UpcomingRides")}
            </span>
            {filteredBookings.length > 0 && activeTab === "upcoming" && (
              <Badge
                variant="secondary"
                className="ml-1 bg-primary/20 text-primary"
              >
                {filteredBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="passed"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">
              {t("Dashboard.Rides.CompletedRides")}
            </span>
            {filteredBookings.length > 0 && activeTab === "passed" && (
              <Badge
                variant="secondary"
                className="ml-1 bg-secondary/20 text-secondary-foreground"
              >
                {filteredBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="canceled"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 py-3 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
          >
            <Ban className="w-4 h-4" />
            <span className="font-medium">
              {t("Dashboard.Rides.CanceledRides")}
            </span>
            {filteredBookings.length > 0 && activeTab === "canceled" && (
              <Badge
                variant="secondary"
                className="ml-1 bg-destructive/20 text-destructive"
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
          fetchBookings={fetchBookings}
          t={t}
          loadingWrapClass="bg-primary/10"
          loadingIconClass="text-primary"
          emptyIcon={CalendarDays}
          emptyTitle={t("Dashboard.Rides.NoUpcomingRides")}
          emptyDescription={t("Dashboard.Rides.NoUpcomingRidesDescription")}
        >
          <AdminRideCardList rides={rides} />
        </AdminRidesTabPanel>

        <AdminRidesTabPanel
          value="passed"
          isLoading={isLoading}
          isEmpty={filteredBookings.length === 0}
          fetchBookings={fetchBookings}
          t={t}
          loadingWrapClass="bg-secondary/10"
          loadingIconClass="text-secondary-foreground"
          emptyIcon={CheckCircle}
          emptyTitle={t("Dashboard.Rides.NoCompletedRides")}
          emptyDescription={t("Dashboard.Rides.NoCompletedRidesDescription")}
        >
          <AdminRideCardList rides={rides} />
        </AdminRidesTabPanel>

        <AdminRidesTabPanel
          value="canceled"
          isLoading={isLoading}
          isEmpty={filteredBookings.length === 0}
          fetchBookings={fetchBookings}
          t={t}
          loadingWrapClass="bg-destructive/10"
          loadingIconClass="text-destructive"
          emptyIcon={Ban}
          emptyTitle={t("Dashboard.Rides.NoCanceledRides")}
          emptyDescription={t("Dashboard.Rides.NoCanceledRidesDescription")}
        >
          <AdminRideCardList rides={rides} />
        </AdminRidesTabPanel>
      </Tabs>

      <AdminRideDetailDialog
        t={rides.t}
        currencySymbol={rides.currencySymbol}
        detailBooking={rides.detailBooking}
        setDetailBooking={rides.setDetailBooking}
        isBookingPassed={rides.isBookingPassed}
        bookingReviews={rides.bookingReviews}
      />

      <AdminRideCancelDialog
        t={rides.t}
        currencySymbol={rides.currencySymbol}
        showCancelDialog={rides.showCancelDialog}
        setShowCancelDialog={rides.setShowCancelDialog}
        selectedBooking={rides.selectedBooking}
        refundPercentage={rides.refundPercentage}
        setRefundPercentage={rides.setRefundPercentage}
        cancelingId={rides.cancelingId}
        handleCancelBooking={rides.handleCancelBooking}
        canRefund={rides.canRefund}
      />
    </div>
  );
}
