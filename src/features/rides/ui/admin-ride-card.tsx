"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { AdminRideCardDialogs } from "@/features/rides/ui/admin-ride-card-dialogs";
import { AdminRideCardAssignActions } from "@/features/rides/ui/admin-ride-card-assign-actions";
import { AdminRideCardCustomer } from "@/features/rides/ui/admin-ride-card-customer";
import { AdminRideCardExtras } from "@/features/rides/ui/admin-ride-card-extras";
import { AdminRideCardHeader } from "@/features/rides/ui/admin-ride-card-header";
import { AdminRideCardRoute } from "@/features/rides/ui/admin-ride-card-route";
import { AdminRideCardSchedule } from "@/features/rides/ui/admin-ride-card-schedule";
import type { IBooking } from "@/features/booking/model";
import type { IDriver } from "@/features/drivers/model";
import type { IPartner } from "@/features/partners/model";
import type { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import type { AdminRideReview } from "@/features/rides/hooks/useAdminRides";
import { DEFAULT_ASSIGN_PARTNER_MARGIN } from "@/features/rides/lib/default-assign-partner-margin";

export type AdminRideCardProps = {
  booking: IBooking;
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
  enablePartners: boolean;
  enableDrivers: boolean;
  drivers: IDriver[];
  partners: IPartner[];
  assigningId: string | null;
  approvingPartnerId: string | null;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
  handleApprovePartnerReview: (bookingId: string, margin: number) => Promise<boolean>;
  handleAssignDriver: (bookingId: string, driverId: string) => Promise<void>;
  handleAssignPartner: (bookingId: string, partnerId: string) => Promise<void>;
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
  drivers,
  partners,
  assigningId,
  approvingPartnerId,
  isBookingPassed,
  handleApprovePartnerReview,
  handleAssignDriver,
  handleAssignPartner,
  handleCancelClick,
  setDetailBooking,
  setBookingReviews,
  cancelingId,
}: AdminRideCardProps) {
    const [selectedDriver, setSelectedDriver] = useState<string>(
      booking.assignedDriver?._id || ""
    );
    const [selectedPartner, setSelectedPartner] = useState<string>(
      booking.assignedPartner?._id || ""
    );
    const [partnerMargin, setPartnerMargin] = useState<number>(
      booking.partnerMarginPercentage ?? 0
    );
    
    // Modal states
    const [showPartnerApprovalModal, setShowPartnerApprovalModal] = useState(false);
    const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
    const [showAssignPartnerModal, setShowAssignPartnerModal] = useState(false);
    const [assignPartnerMargin, setAssignPartnerMargin] = useState<number>(DEFAULT_ASSIGN_PARTNER_MARGIN);

    const bookingId = booking._id?.toString() || "";
    const requiresPartnerReview =
      enablePartners && booking.paymentMethod !== "cash";
    const partnerReviewStatus = booking.partnerReviewStatus ??
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
      setPartnerMargin(booking.partnerMarginPercentage ?? 0);
    }, [booking.partnerMarginPercentage]);

    const getStatusColor = () => {
      if (booking.status === "canceled") return "destructive";
      if (isBookingPassed(booking.date, booking.time)) return "muted";
      return "primary";
    };

    const statusColor = getStatusColor();

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm bg-white overflow-hidden">
        {/* Top border indicator */}
        <div
          className={`h-1 ${
            statusColor === "destructive"
              ? "bg-destructive"
              : statusColor === "muted"
              ? "bg-muted"
              : "bg-primary"
          }`}
        ></div>

        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Header Section */}
            <AdminRideCardHeader
              booking={booking}
              t={t}
              statusColor={statusColor}
            />

            <AdminRideCardSchedule
              booking={booking}
              t={t}
              currencySymbol={currencySymbol}
            />

            {/* Additional Details */}
            <AdminRideCardExtras booking={booking} t={t} />

            {/* Route Information */}
            <AdminRideCardRoute booking={booking} t={t} />

            {/* Customer Information */}
            <AdminRideCardCustomer booking={booking} />

            <AdminRideCardAssignActions
              booking={booking}
              t={t}
              enablePartners={enablePartners}
              enableDrivers={enableDrivers}
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
          </div>
        </CardContent>


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
      </Card>
    );
}
