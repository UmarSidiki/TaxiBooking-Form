"use client";

import { AdminRideCard } from "@/features/rides/ui/admin-ride-card";
import type { useAdminRides } from "@/features/rides/hooks/useAdminRides";

type Rides = ReturnType<typeof useAdminRides>;

const HEADERS = ["col-ref", "col-route", "col-customer", "col-price", "col-status", "col-actions"] as const;

export function AdminRideCardList({ rides }: { rides: Rides }) {
  const cardProps = {
    t: rides.t,
    currencySymbol: rides.currencySymbol,
    enablePartners: rides.enablePartners,
    enableDrivers: rides.enableDrivers,
    partnerCashSettlement: rides.partnerCashSettlement,
    dispatchAssigneeMode: rides.dispatchAssigneeMode,
    defaultPartnerMargin: rides.defaultPartnerMargin,
    drivers: rides.drivers,
    partners: rides.partners,
    assigningId: rides.assigningId,
    approvingPartnerId: rides.approvingPartnerId,
    isBookingPassed: rides.isBookingPassed,
    handleApprovePartnerReview: rides.handleApprovePartnerReview,
    handleAssignDriver: rides.handleAssignDriver,
    handleAssignPartner: rides.handleAssignPartner,
    handleQuoteRequest: rides.handleQuoteRequest,
    handleConfirmCashRequest: rides.handleConfirmCashRequest,
    handleDeclineRequest: rides.handleDeclineRequest,
    handleCancelClick: rides.handleCancelClick,
    setDetailBooking: rides.setDetailBooking,
    setBookingReviews: rides.setBookingReviews,
    cancelingId: rides.cancelingId,
  };

  return (
    <>
      <div role="table" aria-label={rides.t("Dashboard.Rides.table-label")} className="ride-table">
        <div role="row">
          {HEADERS.map((key) => (
            <div key={key} role="columnheader" className={key === "col-price" ? "text-right" : undefined}>
              {key === "col-actions" ? <span className="sr-only">{rides.t(`Dashboard.Rides.${key}`)}</span> : rides.t(`Dashboard.Rides.${key}`)}
            </div>
          ))}
        </div>
        {rides.filteredBookings.map((booking) => (
          <AdminRideCard key={booking._id?.toString()} booking={booking} layout="row" {...cardProps} />
        ))}
      </div>
      <div className="flex flex-col gap-3 lg:hidden">
        {rides.filteredBookings.map((booking) => (
          <AdminRideCard key={booking._id?.toString()} booking={booking} {...cardProps} />
        ))}
      </div>
    </>
  );
}
