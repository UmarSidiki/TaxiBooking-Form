"use client";

import { AdminPartnerDetailsBilling } from "@/features/partners/ui/admin-partner-details-billing";
import { AdminPartnerDetailsDocuments } from "@/features/partners/ui/admin-partner-details-documents";
import { AdminPartnerDetailsFleet } from "@/features/partners/ui/admin-partner-details-fleet";
import { AdminPartnerDetailsProfile } from "@/features/partners/ui/admin-partner-details-profile";
import type { PartnerDrawerTabId } from "@/features/partners/ui/partner-drawer-tab-button";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

export function PartnerDetailsTabContent({
  activeTab,
  t,
  selectedPartner,
  vehicles,
  formatCurrency,
  formatDate,
  payoutProcessingId,
  handleMarkPayoutPaid,
  handleMarkRemittanceReceived,
  handleRecalculatePayout,
  setSelectedDocument,
  setShowDocumentDialog,
  processing,
  handleFleetApprove,
  setSelectedVehicleId,
  setShowFleetRejectDialog,
  setShowFleetRemoveDialog,
  setShowFleetDeleteDialog,
}: {
  activeTab: PartnerDrawerTabId;
} & Pick<
  AdminPartnersState,
  | "t"
  | "selectedPartner"
  | "vehicles"
  | "formatCurrency"
  | "formatDate"
  | "payoutProcessingId"
  | "handleMarkPayoutPaid"
  | "handleMarkRemittanceReceived"
  | "handleRecalculatePayout"
  | "setSelectedDocument"
  | "setShowDocumentDialog"
  | "processing"
  | "handleFleetApprove"
  | "setSelectedVehicleId"
  | "setShowFleetRejectDialog"
  | "setShowFleetRemoveDialog"
  | "setShowFleetDeleteDialog"
>) {
  if (!selectedPartner) return null;

  return (
    <div className="flex flex-col gap-5">
      {activeTab === "profile" ? (
        <AdminPartnerDetailsProfile
          t={t}
          selectedPartner={selectedPartner}
          formatCurrency={formatCurrency}
        />
      ) : null}
      {activeTab === "billing" ? (
        <AdminPartnerDetailsBilling
          t={t}
          selectedPartner={selectedPartner}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          payoutProcessingId={payoutProcessingId}
          handleMarkPayoutPaid={handleMarkPayoutPaid}
          handleMarkRemittanceReceived={handleMarkRemittanceReceived}
          handleRecalculatePayout={handleRecalculatePayout}
        />
      ) : null}
      {activeTab === "documents" ? (
        <AdminPartnerDetailsDocuments
          t={t}
          selectedPartner={selectedPartner}
          setSelectedDocument={setSelectedDocument}
          setShowDocumentDialog={setShowDocumentDialog}
        />
      ) : null}
      {activeTab === "fleet" ? (
        <AdminPartnerDetailsFleet
          t={t}
          selectedPartner={selectedPartner}
          vehicles={vehicles}
          processing={processing}
          handleFleetApprove={handleFleetApprove}
          setSelectedVehicleId={setSelectedVehicleId}
          setShowFleetRejectDialog={setShowFleetRejectDialog}
          setShowFleetRemoveDialog={setShowFleetRemoveDialog}
          setShowFleetDeleteDialog={setShowFleetDeleteDialog}
        />
      ) : null}
      {selectedPartner.status === "rejected" &&
      selectedPartner.rejectionReason ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <h3 className="mb-1 text-sm font-semibold text-destructive">
            {t("partner-rejection-reason")}
          </h3>
          <p className="text-sm text-foreground">
            {selectedPartner.rejectionReason}
          </p>
        </div>
      ) : null}
    </div>
  );
}
