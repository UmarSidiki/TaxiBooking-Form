"use client";

import { AdminPartnerDocumentDialog } from "@/components/admin-partners/admin-partner-document-dialog";
import { AdminPartnerFleetActionDialogs } from "@/components/admin-partners/admin-partner-fleet-action-dialogs";
import { AdminPartnerRejectSuspendDialogs } from "@/components/admin-partners/admin-partner-reject-suspend-dialogs";
import type { useAdminPartners } from "@/hooks/partners/useAdminPartners";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

export function AdminPartnerActionDialogs(
  props: Pick<
    AdminPartnersState,
    | "t"
    | "showRejectDialog"
    | "setShowRejectDialog"
    | "rejectionReason"
    | "setRejectionReason"
    | "handleReject"
    | "processing"
    | "showSuspendDialog"
    | "setShowSuspendDialog"
    | "suspensionReason"
    | "setSuspensionReason"
    | "handleSuspend"
    | "showDocumentDialog"
    | "setShowDocumentDialog"
    | "selectedDocument"
    | "showFleetRejectDialog"
    | "setShowFleetRejectDialog"
    | "fleetRejectionReason"
    | "setFleetRejectionReason"
    | "selectedVehicleId"
    | "handleFleetReject"
    | "showFleetRemoveDialog"
    | "setShowFleetRemoveDialog"
    | "handleFleetRemove"
    | "showFleetDeleteDialog"
    | "setShowFleetDeleteDialog"
    | "setSelectedVehicleId"
    | "handleFleetDelete"
  >
) {
  return (
    <>
      <AdminPartnerRejectSuspendDialogs
        t={props.t}
        showRejectDialog={props.showRejectDialog}
        setShowRejectDialog={props.setShowRejectDialog}
        rejectionReason={props.rejectionReason}
        setRejectionReason={props.setRejectionReason}
        handleReject={props.handleReject}
        processing={props.processing}
        showSuspendDialog={props.showSuspendDialog}
        setShowSuspendDialog={props.setShowSuspendDialog}
        suspensionReason={props.suspensionReason}
        setSuspensionReason={props.setSuspensionReason}
        handleSuspend={props.handleSuspend}
      />
      <AdminPartnerDocumentDialog
        t={props.t}
        showDocumentDialog={props.showDocumentDialog}
        setShowDocumentDialog={props.setShowDocumentDialog}
        selectedDocument={props.selectedDocument}
      />
      <AdminPartnerFleetActionDialogs
        t={props.t}
        showFleetRejectDialog={props.showFleetRejectDialog}
        setShowFleetRejectDialog={props.setShowFleetRejectDialog}
        fleetRejectionReason={props.fleetRejectionReason}
        setFleetRejectionReason={props.setFleetRejectionReason}
        selectedVehicleId={props.selectedVehicleId}
        handleFleetReject={props.handleFleetReject}
        processing={props.processing}
        showFleetRemoveDialog={props.showFleetRemoveDialog}
        setShowFleetRemoveDialog={props.setShowFleetRemoveDialog}
        handleFleetRemove={props.handleFleetRemove}
        showFleetDeleteDialog={props.showFleetDeleteDialog}
        setShowFleetDeleteDialog={props.setShowFleetDeleteDialog}
        setSelectedVehicleId={props.setSelectedVehicleId}
        handleFleetDelete={props.handleFleetDelete}
      />
    </>
  );
}
