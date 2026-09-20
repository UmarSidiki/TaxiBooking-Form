"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IBooking } from "@/models/booking";
import type { AdminRideReview } from "@/hooks/rides/useAdminRides";
import { DEFAULT_ASSIGN_PARTNER_MARGIN } from "@/lib/rides/default-assign-partner-margin";
import {
  Ban,
  CheckCircle,
  Edit,
  Eye,
  Loader2,
  UserCheck,
  Users,
} from "lucide-react";
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
  setBookingReviews: Dispatch<
    SetStateAction<Record<string, AdminRideReview | null>>
  >;
  handleCancelClick: (booking: IBooking) => void;
  cancelingId: string | null;
}) {
  return (
    <>
            {/* Partner Marketplace Approval Button */}
            {enablePartners && booking.paymentMethod !== "cash" && (
              <div className="border-t pt-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <CheckCircle className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-secondary-foreground block">
                        {t("Dashboard.Rides.partner-review-title")}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge
                          variant={isPartnerReviewPending ? "destructive" : "secondary"}
                          className="text-xs text-white"
                        >
                          {isPartnerReviewPending
                            ? t("Dashboard.Rides.partner-review-status-pending")
                            : t("Dashboard.Rides.partner-review-status-approved")}
                        </Badge>
                        {!isPartnerReviewPending && (
                          <span className="text-xs text-muted-foreground">
                            Margin: {booking.partnerMarginPercentage || 0}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isPartnerReviewPending ? "default" : "outline"}
                    onClick={() => {
                      setPartnerMargin(booking.partnerMarginPercentage ?? 0);
                      setShowPartnerApprovalModal(true);
                    }}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
                  >
                    {isPartnerReviewPending ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">{t("Dashboard.Rides.approve-for-partners")}</span>
                        <span className="sm:hidden">Approve</span>
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">{t("Dashboard.Rides.edit-partner-margin")}</span>
                        <span className="sm:hidden">Edit</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Driver Assignment Button */}
            {enableDrivers &&
              booking.status !== "canceled" &&
              !isBookingPassed(booking.date, booking.time) && (
                <div className="border-t pt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <UserCheck className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-secondary-foreground block">
                          {t("Dashboard.Rides.assign-driver")}
                        </span>
                        {booking.assignedDriver && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {booking.assignedDriver.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={booking.assignedDriver ? "outline" : "default"}
                      onClick={() => setShowAssignDriverModal(true)}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
                    >
                      {booking.assignedDriver ? (
                        <>
                          <Edit className="w-4 h-4" />
                          {t("Dashboard.Rides.reassign")}
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          {t("Dashboard.Rides.assign")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

            {/* Partner Assignment Button */}
            {enablePartners &&
              booking.status !== "canceled" &&
              !isBookingPassed(booking.date, booking.time) && (
                <div className="border-t pt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Users className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-secondary-foreground block">
                          {t("Dashboard.Rides.assign-partner")}
                        </span>
                        {booking.assignedPartner && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {booking.assignedPartner.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={booking.assignedPartner ? "outline" : "default"}
                      onClick={() => {
                        setAssignPartnerMargin(booking.partnerMarginPercentage || DEFAULT_ASSIGN_PARTNER_MARGIN);
                        setShowAssignPartnerModal(true);
                      }}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
                    >
                      {booking.assignedPartner ? (
                        <>
                          <Edit className="w-4 h-4" />
                          {t("Dashboard.Rides.reassign")}
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          {t("Dashboard.Rides.assign")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setDetailBooking(booking);
                  // Fetch review for this booking if it's completed
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
                className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              >
                <Eye className="w-4 h-4" />
                {t("Dashboard.Rides.ViewDetails")}
              </Button>

              {booking.status !== "canceled" &&
                !isBookingPassed(booking.date, booking.time) && (
                  <Button
                    onClick={() => handleCancelClick(booking)}
                    variant="destructive"
                    size="sm"
                    disabled={cancelingId === booking._id?.toString()}
                    className="flex items-center gap-2"
                  >
                    {cancelingId === booking._id?.toString() ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("Dashboard.Rides.Canceling")}
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        {t("Dashboard.Rides.Cancel")}
                      </>
                    )}
                  </Button>
                )}
            </div>
    </>
  );
}
