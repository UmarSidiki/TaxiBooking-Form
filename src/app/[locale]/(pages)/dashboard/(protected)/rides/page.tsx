"use client";

import { AdminRideCancelDialog } from "@/features/rides/ui/admin-ride-cancel-dialog";
import { AdminRideDetailDialog } from "@/features/rides/ui/admin-ride-detail-dialog";
import { AdminRidesTabs } from "@/features/rides/ui/admin-rides-tabs";
import { AdminRidesToolbar } from "@/features/rides/ui/admin-rides-toolbar";
import { useAdminRides } from "@/features/rides/hooks/useAdminRides";

export default function RidesPage() {
  const rides = useAdminRides();
  const {
    t,
    loadError,
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
            className="ms-3 min-h-11 rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            className="ms-3 min-h-11 rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => setNotice(null)}
          >
            {t("Dashboard.Rides.Dismiss")}
          </button>
        </p>
      ) : null}

      <AdminRidesTabs rides={rides} />

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
