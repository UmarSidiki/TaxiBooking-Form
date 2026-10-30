"use client";

import { Button } from "@/shared/ui/button";
import { DataList } from "@/features/dashboard/ui/riviera/data-list";
import { AdminRideCard } from "@/features/rides/ui/admin-ride-card";
import { RideStatusBadge } from "@/features/rides/ui/ride-status-badge";
import { RidePaymentStatusBadge } from "@/features/rides/ui/ride-payment-status-badge";
import type { useAdminRides } from "@/features/rides/hooks/useAdminRides";

type Rides = ReturnType<typeof useAdminRides>;

export function AdminRideCardList({ rides }: { rides: Rides }) {
  const desktopColumns = [
    {
      key: "ref",
      header: "Ref",
      render: (booking: any) => {
        const ref = String(booking.tripId ?? "");
        return <span className="font-mono text-xs whitespace-nowrap" title={ref}>{ref.slice(0, 10)}</span>;
      },
    },
    {
      key: "when",
      header: "When",
      render: (booking: any) => (
        <span className="font-mono text-xs whitespace-nowrap">
          {booking.date} {booking.time}
        </span>
      ),
    },
    {
      key: "route",
      header: "Route",
      render: (booking: any) => (
        <span className="truncate max-w-[200px] inline-block">
          {booking.pickup} → {booking.dropoff}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (booking: any) => <span className="text-xs">{booking.firstName} {booking.lastName}</span>,
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (booking: any) => <span className="text-xs">{booking.vehicleDetails?.name || booking.selectedVehicle}</span>,
    },
    {
      key: "price",
      header: "Price",
      render: (booking: any) => <span className="font-mono text-xs">{rides.currencySymbol}{Number(booking.totalAmount ?? 0).toFixed(2)}</span>,
      className: "text-right",
    },
    {
      key: "status",
      header: "Status",
      render: (booking: any) => (
        <div className="flex flex-col gap-1">
          <RideStatusBadge booking={booking} />
          <RidePaymentStatusBadge status={booking.paymentStatus ?? "pending"} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (booking: any) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => rides.setDetailBooking(booking)}>
            View
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-[var(--err)]" onClick={() => rides.handleCancelClick(booking)}>
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="hidden md:block">
        <DataList
          rows={rides.filteredBookings as any}
          columns={desktopColumns as any}
          empty={<p className="text-sm text-[var(--ink2)]">No rides</p>}
        />
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {rides.filteredBookings.map((booking) => (
          <AdminRideCard
            key={booking._id?.toString()}
            booking={booking}
            t={rides.t}
            currencySymbol={rides.currencySymbol}
            enablePartners={rides.enablePartners}
            enableDrivers={rides.enableDrivers}
            partnerCashSettlement={rides.partnerCashSettlement}
            dispatchAssigneeMode={rides.dispatchAssigneeMode}
            defaultPartnerMargin={rides.defaultPartnerMargin}
            drivers={rides.drivers}
            partners={rides.partners}
            assigningId={rides.assigningId}
            approvingPartnerId={rides.approvingPartnerId}
            isBookingPassed={rides.isBookingPassed}
            handleApprovePartnerReview={rides.handleApprovePartnerReview}
            handleAssignDriver={rides.handleAssignDriver}
            handleAssignPartner={rides.handleAssignPartner}
            handleQuoteRequest={rides.handleQuoteRequest}
            handleConfirmCashRequest={rides.handleConfirmCashRequest}
            handleDeclineRequest={rides.handleDeclineRequest}
            handleCancelClick={rides.handleCancelClick}
            setDetailBooking={rides.setDetailBooking}
            setBookingReviews={rides.setBookingReviews}
            cancelingId={rides.cancelingId}
          />
        ))}
      </div>
    </>
  );
}