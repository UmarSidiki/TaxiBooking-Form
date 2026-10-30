"use client";

import { Button } from "@/shared/ui/button";
import type { IBooking } from "@/features/booking/model";
import type { AdminRideReview } from "@/features/rides/hooks/useAdminRides";
import { AdminRideCardPartnerReview } from "@/features/rides/ui/admin-ride-card-partner-review";
import { Ban, Edit, Eye, Loader2, UserCheck, Users } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideCardAssignActions({
  booking,
  t,
  enablePartners,
  enableDrivers,
  partnerCashSettlement,
  dispatchAssigneeMode,
  defaultPartnerMargin,
  isPartnerReviewPending,
  isBookingPassed,
  setPartnerMargin,
  setShowPartnerApprovalModal,
  setShowAssignDriverModal,
  setAssignPartnerMargin,
  setShowAssignPartnerModal,
  setDetailBooking,
  setBookingReviews,
  handleCancelClick,
  cancelingId,
  compact = false,
}: {
  booking: IBooking;
  t: TFn;
  enablePartners: boolean;
  enableDrivers: boolean;
  partnerCashSettlement: "keep_cash" | "operator_margin";
  dispatchAssigneeMode: "exclusive" | "allow_both";
  defaultPartnerMargin: number;
  isPartnerReviewPending: boolean;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
  setPartnerMargin: Dispatch<SetStateAction<number>>;
  setShowPartnerApprovalModal: Dispatch<SetStateAction<boolean>>;
  setShowAssignDriverModal: Dispatch<SetStateAction<boolean>>;
  setAssignPartnerMargin: Dispatch<SetStateAction<number>>;
  setShowAssignPartnerModal: Dispatch<SetStateAction<boolean>>;
  setDetailBooking: (booking: IBooking | null) => void;
  setBookingReviews: Dispatch<
    SetStateAction<Record<string, AdminRideReview | null>>
  >;
  handleCancelClick: (booking: IBooking) => void;
  cancelingId: string | null;
  /** Single-line ghost buttons for the desktop ride rows. */
  compact?: boolean;
}) {
  const upcoming =
    booking.status !== "canceled" &&
    !isBookingPassed(booking.date, booking.time);
  const bookingId = booking._id?.toString();
  const needsReview =
    enablePartners &&
    (booking.paymentMethod !== "cash" ||
      partnerCashSettlement === "operator_margin");
  const exclusive = dispatchAssigneeMode === "exclusive";
  const showDriverChip =
    enableDrivers &&
    (!exclusive || !booking.assignedPartner || Boolean(booking.assignedDriver));
  const showPartnerChip =
    enablePartners &&
    (!exclusive || !booking.assignedDriver || Boolean(booking.assignedPartner));

  const openDetails = async () => {
    setDetailBooking(booking);
    if (
      booking._id &&
      (booking.status === "canceled" ||
        isBookingPassed(booking.date, booking.time))
    ) {
      try {
        const response = await fetch(`/api/reviews?bookingId=${booking._id}`);
        const data = await response.json();
        if (data.success && data.review) {
          setBookingReviews((prev) => ({
            ...prev,
            [booking._id!.toString()]: data.review,
          }));
        }
      } catch (error) {
        console.error("Error fetching review:", error);
      }
    }
  };
  const openAssignPartner = () => {
    setAssignPartnerMargin(booking.partnerMarginPercentage || defaultPartnerMargin);
    setShowAssignPartnerModal(true);
  };
  const isCanceling = cancelingId === bookingId;

  if (compact) {
    const viewLabel = t("Dashboard.Rides.ViewDetails");
    const cancelLabel = isCanceling ? t("Dashboard.Rides.Canceling") : t("Dashboard.Rides.Cancel");
    return (
      <div className="flex flex-col items-end gap-0.5">
        {needsReview && isPartnerReviewPending ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => {
              setPartnerMargin(booking.partnerMarginPercentage ?? 0);
              setShowPartnerApprovalModal(true);
            }}
          >
            {t("Dashboard.Rides.approve-for-partners")}
          </Button>
        ) : null}
        {showDriverChip && upcoming ? (
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowAssignDriverModal(true)}>
            <UserCheck className="size-4" aria-hidden="true" />
            {booking.assignedDriver?.name ?? t("Dashboard.Rides.assign-driver-action")}
          </Button>
        ) : null}
        {showPartnerChip && upcoming ? (
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={openAssignPartner}>
            <Users className="size-4" aria-hidden="true" />
            {booking.assignedPartner?.name ?? t("Dashboard.Rides.assign-partner-action")}
          </Button>
        ) : null}
        <div className="flex gap-0.5">
          <Button size="icon" variant="ghost" className="size-8" onClick={openDetails} aria-label={viewLabel} title={viewLabel}>
            <Eye className="size-4" aria-hidden="true" />
          </Button>
          {upcoming ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-[color:var(--err)] hover:text-[color:var(--err)]"
              onClick={() => handleCancelClick(booking)}
              disabled={isCanceling}
              aria-label={cancelLabel}
              title={cancelLabel}
            >
              {isCanceling ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Ban className="size-4" aria-hidden="true" />}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
      {needsReview ? (
        <AdminRideCardPartnerReview
          booking={booking}
          t={t}
          isPartnerReviewPending={isPartnerReviewPending}
          setPartnerMargin={setPartnerMargin}
          setShowPartnerApprovalModal={setShowPartnerApprovalModal}
        />
      ) : null}

      {(showDriverChip || showPartnerChip) && upcoming ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {showDriverChip ? (
            <AssignChip
              label={t("Dashboard.Rides.assign-driver")}
              value={booking.assignedDriver?.name}
              assigned={Boolean(booking.assignedDriver)}
              assignLabel={t("Dashboard.Rides.assign")}
              reassignLabel={t("Dashboard.Rides.reassign")}
              icon={booking.assignedDriver ? Edit : UserCheck}
              onClick={() => setShowAssignDriverModal(true)}
            />
          ) : null}
          {showPartnerChip ? (
            <AssignChip
              label={t("Dashboard.Rides.assign-partner")}
              value={booking.assignedPartner?.name}
              assigned={Boolean(booking.assignedPartner)}
              assignLabel={t("Dashboard.Rides.assign")}
              reassignLabel={t("Dashboard.Rides.reassign")}
              icon={booking.assignedPartner ? Edit : Users}
              onClick={openAssignPartner}
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          className="h-10 flex-1 rounded"
          onClick={openDetails}
        >
          <Eye className="size-4" aria-hidden="true" />
          {t("Dashboard.Rides.ViewDetails")}
        </Button>
        {upcoming ? (
          <Button
            onClick={() => handleCancelClick(booking)}
            variant="destructive"
            className="h-10 rounded sm:w-auto"
            disabled={isCanceling}
          >
            {isCanceling ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Ban className="size-4" aria-hidden="true" />
            )}
            {isCanceling
              ? t("Dashboard.Rides.Canceling")
              : t("Dashboard.Rides.Cancel")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function AssignChip({
  label,
  value,
  assigned,
  assignLabel,
  reassignLabel,
  icon: Icon,
  onClick,
}: {
  label: string;
  value?: string;
  assigned: boolean;
  assignLabel: string;
  reassignLabel: string;
  icon: typeof Edit;
  onClick: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded border border-border/60 bg-muted/30 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {value ? (
          <p className="truncate text-sm font-medium text-foreground">{value}</p>
        ) : null}
      </div>
      <Button
        size="sm"
        variant={assigned ? "outline" : "default"}
        className="h-11 shrink-0 rounded-lg"
        onClick={onClick}
      >
        <Icon className="size-4" aria-hidden="true" />
        {assigned ? reassignLabel : assignLabel}
      </Button>
    </div>
  );
}
