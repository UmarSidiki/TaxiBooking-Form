"use client";

import { AdminRideCard } from "@/features/rides/ui/admin-ride-card";
import type { useAdminRides } from "@/features/rides/hooks/useAdminRides";

type Rides = ReturnType<typeof useAdminRides>;

export function AdminRideCardList({ rides }: { rides: Rides }) {
  return (
    <>
      {rides.filteredBookings.map((booking) => (
        <AdminRideCard
          key={booking._id?.toString()}
          booking={booking}
          t={rides.t}
          currencySymbol={rides.currencySymbol}
          enablePartners={rides.enablePartners}
          enableDrivers={rides.enableDrivers}
          drivers={rides.drivers}
          partners={rides.partners}
          assigningId={rides.assigningId}
          approvingPartnerId={rides.approvingPartnerId}
          isBookingPassed={rides.isBookingPassed}
          handleApprovePartnerReview={rides.handleApprovePartnerReview}
          handleAssignDriver={rides.handleAssignDriver}
          handleAssignPartner={rides.handleAssignPartner}
          handleCancelClick={rides.handleCancelClick}
          setDetailBooking={rides.setDetailBooking}
          setBookingReviews={rides.setBookingReviews}
          cancelingId={rides.cancelingId}
        />
      ))}
    </>
  );
}
