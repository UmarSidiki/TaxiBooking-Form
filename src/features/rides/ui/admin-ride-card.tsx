"use client";

import { useState, useEffect } from "react";
import { AdminRideCardDialogs } from "@/features/rides/ui/admin-ride-card-dialogs";
import { AdminRideCardAssignActions } from "@/features/rides/ui/admin-ride-card-assign-actions";
import { AdminRideCardCustomer } from "@/features/rides/ui/admin-ride-card-customer";
import { AdminRideCardExtras } from "@/features/rides/ui/admin-ride-card-extras";
import { AdminRideCardHeader } from "@/features/rides/ui/admin-ride-card-header";
import { AdminRideCardRoute } from "@/features/rides/ui/admin-ride-card-route";
import { AdminRideCardSchedule } from "@/features/rides/ui/admin-ride-card-schedule";
import { AdminRideRequestActionsDialog } from "@/features/rides/ui/admin-ride-request-actions-dialog";
import { Button } from "@/shared/ui/button";
import { Inbox } from "lucide-react";
import type { IBooking } from "@/features/booking/model";
import type { IDriver } from "@/features/drivers/model";
import type { IPartner } from "@/features/partners/model";
import type { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import type { AdminRideReview } from "@/features/rides/hooks/useAdminRides";
export type AdminRideCardProps = {
  booking: IBooking;
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
  enablePartners: boolean;
  enableDrivers: boolean;
  partnerCashSettlement: "keep_cash" | "operator_margin";
  dispatchAssigneeMode: "exclusive" | "allow_both";
  defaultPartnerMargin: number;
  drivers: IDriver[];
  partners: IPartner[];
  assigningId: string | null;
  approvingPartnerId: string | null;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
  handleApprovePartnerReview: (
    bookingId: string,
    margin: number,
    options?: { notifyPartners?: boolean }
  ) => Promise<boolean>;
  handleAssignDriver: (bookingId: string, driverId: string) => Promise<void>;
  handleAssignPartner: (bookingId: string, partnerId: string) => Promise<void>;
  handleQuoteRequest: (bookingId: string, amount: number) => Promise<boolean>;
  handleConfirmCashRequest: (bookingId: string) => Promise<boolean>;
  handleDeclineRequest: (
    bookingId: string,
    reason?: string
  ) => Promise<boolean>;
  handleCancelClick: (booking: IBooking) => void;
  setDetailBooking: (booking: IBooking | null) => void;
  setBookingReviews: Dispatch<
    SetStateAction<Record<string, AdminRideReview | null>>
  >;
  cancelingId: string | null;
};

export function AdminRideCard({
  booking,
  t,
  currencySymbol,
  enablePartners,
  enableDrivers,
  partnerCashSettlement,
  dispatchAssigneeMode,
  defaultPartnerMargin,
  drivers,
  partners,
  assigningId,
  approvingPartnerId,
  isBookingPassed,
  handleApprovePartnerReview,
  handleAssignDriver,
  handleAssignPartner,
  handleQuoteRequest,
  handleConfirmCashRequest,
  handleDeclineRequest,
  handleCancelClick,
  setDetailBooking,
  setBookingReviews,
  cancelingId,
}: AdminRideCardProps) {
  const [selectedDriver, setSelectedDriver] = useState(
    booking.assignedDriver?._id || ""
  );
  const [selectedPartner, setSelectedPartner] = useState(
    booking.assignedPartner?._id || ""
  );
  const [showRequestActions, setShowRequestActions] = useState(false);
  const [partnerMargin, setPartnerMargin] = useState(
    booking.partnerMarginPercentage ?? defaultPartnerMargin
  );
  const [showPartnerApprovalModal, setShowPartnerApprovalModal] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [showAssignPartnerModal, setShowAssignPartnerModal] = useState(false);
  const [assignPartnerMargin, setAssignPartnerMargin] = useState(
    defaultPartnerMargin
  );

  const bookingId = booking._id?.toString() || "";
  const requiresPartnerReview =
    enablePartners &&
    (booking.paymentMethod !== "cash" ||
      partnerCashSettlement === "operator_margin");
  const partnerReviewStatus =
    booking.partnerReviewStatus ??
    (requiresPartnerReview ? "pending" : "approved");
  const isPartnerReviewPending =
    requiresPartnerReview && partnerReviewStatus !== "approved";
  const totalAmountValue =
    typeof booking.totalAmount === "number" ? booking.totalAmount : 0;
  const marginPreviewAmountRaw = (totalAmountValue * partnerMargin) / 100;
  const marginPreviewAmount = Number(
    Math.min(totalAmountValue, Math.max(0, marginPreviewAmountRaw)).toFixed(2)
  );
  const partnerPayoutPreview = Number(
    Math.max(0, totalAmountValue - marginPreviewAmount).toFixed(2)
  );
  const isApprovingThisBooking = approvingPartnerId === bookingId;
  const approvalButtonLabel = isPartnerReviewPending
    ? t("Dashboard.Rides.approve-for-partners")
    : t("Dashboard.Rides.update-partner-approval");

  useEffect(() => {
    setPartnerMargin(
      booking.partnerMarginPercentage ?? defaultPartnerMargin
    );
  }, [booking.partnerMarginPercentage, defaultPartnerMargin]);

  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-card transition-shadow duration-200 hover:shadow-md">
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <AdminRideCardHeader booking={booking} t={t} />
        <AdminRideCardSchedule
          booking={booking}
          t={t}
          currencySymbol={currencySymbol}
        />
        <AdminRideCardRoute booking={booking} t={t} />
        <AdminRideCardExtras booking={booking} t={t} />
        <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-start sm:justify-between">
          <AdminRideCardCustomer booking={booking} />
        </div>
        {booking.status === "requested" ||
        booking.status === "awaiting_payment" ? (
          <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
            <Button
              type="button"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => setShowRequestActions(true)}
            >
              <Inbox className="size-4" data-icon="inline-start" />
              {t("Dashboard.Rides.review-request")}
            </Button>
          </div>
        ) : (
          <AdminRideCardAssignActions
            booking={booking}
            t={t}
            enablePartners={enablePartners}
            enableDrivers={enableDrivers}
            partnerCashSettlement={partnerCashSettlement}
            dispatchAssigneeMode={dispatchAssigneeMode}
            defaultPartnerMargin={defaultPartnerMargin}
            isPartnerReviewPending={isPartnerReviewPending}
            isBookingPassed={isBookingPassed}
            setPartnerMargin={setPartnerMargin}
            setShowPartnerApprovalModal={setShowPartnerApprovalModal}
            setShowAssignDriverModal={setShowAssignDriverModal}
            setAssignPartnerMargin={setAssignPartnerMargin}
            setShowAssignPartnerModal={setShowAssignPartnerModal}
            setDetailBooking={setDetailBooking}
            setBookingReviews={setBookingReviews}
            handleCancelClick={handleCancelClick}
            cancelingId={cancelingId}
          />
        )}
      </div>

      <AdminRideRequestActionsDialog
        t={t}
        booking={booking}
        open={showRequestActions}
        onOpenChange={setShowRequestActions}
        currencySymbol={currencySymbol}
        onQuote={(amount) => handleQuoteRequest(bookingId, amount)}
        onConfirmCash={() => handleConfirmCashRequest(bookingId)}
        onDecline={(reason) => handleDeclineRequest(bookingId, reason)}
      />

      <AdminRideCardDialogs
        t={t}
        booking={booking}
        bookingId={bookingId}
        currencySymbol={currencySymbol}
        totalAmountValue={totalAmountValue}
        partnerMargin={partnerMargin}
        setPartnerMargin={setPartnerMargin}
        marginPreviewAmount={marginPreviewAmount}
        partnerPayoutPreview={partnerPayoutPreview}
        approvalButtonLabel={approvalButtonLabel}
        isApprovingThisBooking={isApprovingThisBooking}
        isPartnerReviewPending={isPartnerReviewPending}
        showPartnerApprovalModal={showPartnerApprovalModal}
        setShowPartnerApprovalModal={setShowPartnerApprovalModal}
        showAssignDriverModal={showAssignDriverModal}
        setShowAssignDriverModal={setShowAssignDriverModal}
        showAssignPartnerModal={showAssignPartnerModal}
        setShowAssignPartnerModal={setShowAssignPartnerModal}
        selectedDriver={selectedDriver}
        setSelectedDriver={setSelectedDriver}
        selectedPartner={selectedPartner}
        setSelectedPartner={setSelectedPartner}
        assignPartnerMargin={assignPartnerMargin}
        setAssignPartnerMargin={setAssignPartnerMargin}
        drivers={drivers}
        partners={partners}
        assigningId={assigningId}
        approvingPartnerId={approvingPartnerId}
        handleApprovePartnerReview={handleApprovePartnerReview}
        handleAssignDriver={handleAssignDriver}
        handleAssignPartner={handleAssignPartner}
      />
    </article>
  );
}
