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
              onClick={() => {
                setAssignPartnerMargin(
                  booking.partnerMarginPercentage || defaultPartnerMargin
                );
                setShowAssignPartnerModal(true);
              }}
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          className="h-10 flex-1 rounded-xl"
          onClick={async () => {
            setDetailBooking(booking);
            if (
              booking._id &&
              (booking.status === "canceled" ||
                isBookingPassed(booking.date, booking.time))
            ) {
              try {
                const response = await fetch(
                  `/api/reviews?bookingId=${booking._id}`
                );
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
          }}
        >
          <Eye className="size-4" aria-hidden="true" />
          {t("Dashboard.Rides.ViewDetails")}
        </Button>
        {upcoming ? (
          <Button
            onClick={() => handleCancelClick(booking)}
            variant="destructive"
            className="h-10 rounded-xl sm:w-auto"
            disabled={cancelingId === bookingId}
          >
            {cancelingId === bookingId ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Ban className="size-4" aria-hidden="true" />
            )}
            {cancelingId === bookingId
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
    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {value ? (
          <p className="truncate text-sm font-medium text-foreground">{value}</p>
        ) : null}
      </div>
      <Button
        size="sm"
        variant={assigned ? "outline" : "default"}
        className="h-9 shrink-0 rounded-lg"
        onClick={onClick}
      >
        <Icon className="size-4" aria-hidden="true" />
        {assigned ? reassignLabel : assignLabel}
      </Button>
    </div>
  );
}
