"use client";

import { useState } from "react";

import { NewDeskBookingDrawer } from "@/features/desk-booking/ui/new-desk-booking-drawer";
import { AdminRideCancelDialog } from "@/features/rides/ui/admin-ride-cancel-dialog";
import { AdminRideDetailDialog } from "@/features/rides/ui/admin-ride-detail-dialog";
import { AdminRidesTabs } from "@/features/rides/ui/admin-rides-tabs";
import { AdminRidesToolbar } from "@/features/rides/ui/admin-rides-toolbar";
import { DeskNotice } from "@/features/dashboard/ui/desk-notice";
import { useAdminRides } from "@/features/rides/hooks/useAdminRides";

export default function RidesPage() {
  const rides = useAdminRides();
  const { t, loadError, fetchBookings, notice, setNotice } = rides;
  const [showNewBooking, setShowNewBooking] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <AdminRidesToolbar
        t={rides.t}
        isLoading={rides.isLoading}
        fetchBookings={rides.fetchBookings}
        searchQuery={rides.searchQuery}
        setSearchQuery={rides.setSearchQuery}
        dateRange={rides.dateRange}
        setDateRange={rides.setDateRange}
        paymentFilter={rides.paymentFilter}
        setPaymentFilter={rides.setPaymentFilter}
        sortBy={rides.sortBy}
        setSortBy={rides.setSortBy}
        onNewBooking={() => setShowNewBooking(true)}
      />

      {loadError ? (
        <DeskNotice
          variant="error"
          onRetry={() => void fetchBookings()}
          retryLabel={t("Dashboard.Home.try-again")}
        >
          {loadError}
        </DeskNotice>
      ) : null}

      {notice ? (
        <DeskNotice
          onDismiss={() => setNotice(null)}
          dismissLabel={t("Dashboard.Rides.Dismiss")}
        >
          {notice}
        </DeskNotice>
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

      <NewDeskBookingDrawer
        open={showNewBooking}
        onOpenChange={setShowNewBooking}
        onCreated={(tripId) => {
          setNotice(t("Dashboard.Rides.booking-created", { tripId }));
          void fetchBookings();
        }}
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
