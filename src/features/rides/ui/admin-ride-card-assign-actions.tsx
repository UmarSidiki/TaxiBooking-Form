"use client";

import { Button } from "@/shared/ui/button";
import type { IBooking } from "@/features/booking/model";
import type { AdminRideReview } from "@/features/rides/hooks/useAdminRides";
import { DEFAULT_ASSIGN_PARTNER_MARGIN } from "@/features/rides/lib/default-assign-partner-margin";
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
  isPartnerReviewPending: boolean;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
  setPartnerMargin: Dispatch<SetStateAction<number>>;
  setShowPartnerApprovalModal: Dispatch<SetStateAction<boolean>>;
  setShowAssignDriverModal: Dispatch<SetStateAction<boolean>>;
  setAssignPartnerMargin: Dispatch<SetStateAction<number>>;
  setShowAssignPartnerModal: Dispatch<SetStateAction<boolean>>;
  setDetailBooking: (booking: IBooking | null) => void;
  setBookingReviews: Dispatch<SetStateAction<Record<string, AdminRideReview | null>>>;
  handleCancelClick: (booking: IBooking) => void;
  cancelingId: string | null;
}) {
  const upcoming = booking.status !== "canceled" && !isBookingPassed(booking.date, booking.time);

  return (
    <>
      {enablePartners && booking.paymentMethod !== "cash" ? (
        <AdminRideCardPartnerReview
          booking={booking}
          t={t}
          isPartnerReviewPending={isPartnerReviewPending}
          setPartnerMargin={setPartnerMargin}
          setShowPartnerApprovalModal={setShowPartnerApprovalModal}
        />
      ) : null}
      {enableDrivers && upcoming ? (
        <div className="border-t border-border pt-3">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{t("Dashboard.Rides.assign-driver")}</p>
              {booking.assignedDriver ? (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {booking.assignedDriver.name}
                </p>
              ) : null}
            </div>
            <Button
              className="h-11 w-full sm:w-auto"
              variant={booking.assignedDriver ? "outline" : "default"}
              onClick={() => setShowAssignDriverModal(true)}
            >
              {booking.assignedDriver ? <Edit className="size-4" /> : <UserCheck className="size-4" />}
              {booking.assignedDriver ? t("Dashboard.Rides.reassign") : t("Dashboard.Rides.assign")}
            </Button>
          </div>
        </div>
      ) : null}
      {enablePartners && upcoming ? (
        <div className="border-t border-border pt-3">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{t("Dashboard.Rides.assign-partner")}</p>
              {booking.assignedPartner ? (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {booking.assignedPartner.name}
                </p>
              ) : null}
            </div>
            <Button
              className="h-11 w-full sm:w-auto"
              variant={booking.assignedPartner ? "outline" : "default"}
              onClick={() => {
                setAssignPartnerMargin(
                  booking.partnerMarginPercentage || DEFAULT_ASSIGN_PARTNER_MARGIN
                );
                setShowAssignPartnerModal(true);
              }}
            >
              {booking.assignedPartner ? <Edit className="size-4" /> : <Users className="size-4" />}
              {booking.assignedPartner ? t("Dashboard.Rides.reassign") : t("Dashboard.Rides.assign")}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-2 border-t border-border pt-2 sm:flex-row">
        <Button
          variant="outline"
          className="h-11"
          onClick={async () => {
            setDetailBooking(booking);
            if (
              booking._id &&
              (booking.status === "canceled" || isBookingPassed(booking.date, booking.time))
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
          }}
        >
          <Eye className="size-4" />
          {t("Dashboard.Rides.ViewDetails")}
        </Button>
        {upcoming ? (
          <Button
            onClick={() => handleCancelClick(booking)}
            variant="destructive"
            className="h-11"
            disabled={cancelingId === booking._id?.toString()}
          >
            {cancelingId === booking._id?.toString() ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Ban className="size-4" />
            )}
            {cancelingId === booking._id?.toString()
              ? t("Dashboard.Rides.Canceling")
              : t("Dashboard.Rides.Cancel")}
          </Button>
        ) : null}
      </div>
    </>
  );
}
