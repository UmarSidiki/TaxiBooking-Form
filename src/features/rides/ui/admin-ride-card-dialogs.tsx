"use client";

import { AdminRideAssignDriverDialog } from "@/components/rides/admin-ride-assign-driver-dialog";
import { AdminRideAssignPartnerDialog } from "@/components/rides/admin-ride-assign-partner-dialog";
import { AdminRidePartnerApprovalDialog } from "@/components/rides/admin-ride-partner-approval-dialog";
import type { AdminRideCardDialogsProps } from "@/components/rides/admin-ride-card-dialogs.types";

export type { AdminRideCardDialogsProps } from "@/components/rides/admin-ride-card-dialogs.types";

export function AdminRideCardDialogs(p: AdminRideCardDialogsProps) {
  return (
    <>
        {/* Partner Approval Modal */}
        <AdminRidePartnerApprovalDialog
          t={p.t}
          booking={p.booking}
          bookingId={p.bookingId}
          currencySymbol={p.currencySymbol}
          totalAmountValue={p.totalAmountValue}
          partnerMargin={p.partnerMargin}
          setPartnerMargin={p.setPartnerMargin}
          marginPreviewAmount={p.marginPreviewAmount}
          partnerPayoutPreview={p.partnerPayoutPreview}
          approvalButtonLabel={p.approvalButtonLabel}
          isApprovingThisBooking={p.isApprovingThisBooking}
          isPartnerReviewPending={p.isPartnerReviewPending}
          showPartnerApprovalModal={p.showPartnerApprovalModal}
          setShowPartnerApprovalModal={p.setShowPartnerApprovalModal}
          handleApprovePartnerReview={p.handleApprovePartnerReview}
        />

        {/* Assign Driver Modal */}
        <AdminRideAssignDriverDialog
          t={p.t}
          booking={p.booking}
          showAssignDriverModal={p.showAssignDriverModal}
          setShowAssignDriverModal={p.setShowAssignDriverModal}
          selectedDriver={p.selectedDriver}
          setSelectedDriver={p.setSelectedDriver}
          drivers={p.drivers}
          assigningId={p.assigningId}
          handleAssignDriver={p.handleAssignDriver}
        />

        {/* Assign Partner Modal */}
        <AdminRideAssignPartnerDialog
          t={p.t}
          booking={p.booking}
          bookingId={p.bookingId}
          currencySymbol={p.currencySymbol}
          totalAmountValue={p.totalAmountValue}
          showAssignPartnerModal={p.showAssignPartnerModal}
          setShowAssignPartnerModal={p.setShowAssignPartnerModal}
          selectedPartner={p.selectedPartner}
          setSelectedPartner={p.setSelectedPartner}
          assignPartnerMargin={p.assignPartnerMargin}
          setAssignPartnerMargin={p.setAssignPartnerMargin}
          partners={p.partners}
          assigningId={p.assigningId}
          approvingPartnerId={p.approvingPartnerId}
          handleApprovePartnerReview={p.handleApprovePartnerReview}
          handleAssignPartner={p.handleAssignPartner}
        />
    </>
  );
}
