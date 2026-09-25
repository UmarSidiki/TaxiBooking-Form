"use client";

import { DeskNotice } from "@/features/dashboard/ui/desk-notice";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { AdminPartnerActionDialogs } from "@/features/partners/ui/admin-partner-action-dialogs";
import { AdminPartnerDetailsDialog } from "@/features/partners/ui/admin-partner-details-dialog";
import { AdminPartnerFilters } from "@/features/partners/ui/admin-partner-filters";
import { AdminPartnerList } from "@/features/partners/ui/admin-partner-list";
import { AdminPartnerStats } from "@/features/partners/ui/admin-partner-stats";
import { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";

export default function AdminPartnersPage() {
  const partners = useAdminPartners();
  const { t, loading, loadError } = partners;

  if (loading) {
    return (
      <div className="flex flex-col gap-5" role="status">
        <DeskPageMeta title={t("title")} description={t("description")} />
        <span className="sr-only">{t("title")}…</span>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-xl border border-border/60 bg-card"
            />
          ))}
        </div>
        <div className="h-12 animate-pulse rounded-2xl border border-border/60 bg-card" />
        <div className="h-64 animate-pulse rounded-xl border border-border/60 bg-card" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-5">
        <DeskPageMeta title={t("title")} description={t("description")} />
        <DeskNotice
          variant="error"
          onRetry={() => void partners.fetchPartners()}
          retryLabel={t("retry")}
        >
          {loadError}
        </DeskNotice>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta title={t("title")} description={t("description")} />
      {partners.notice ? (
        <DeskNotice
          onDismiss={() => partners.setNotice(null)}
          dismissLabel={t("dismiss")}
        >
          {partners.notice}
        </DeskNotice>
      ) : null}

      <AdminPartnerStats t={partners.t} stats={partners.stats} />
      <AdminPartnerFilters
        t={partners.t}
        searchQuery={partners.searchQuery}
        setSearchQuery={partners.setSearchQuery}
        statusFilter={partners.statusFilter}
        setStatusFilter={partners.setStatusFilter}
      />
      <AdminPartnerList
        t={partners.t}
        filteredPartners={partners.filteredPartners}
        setSelectedPartner={partners.setSelectedPartner}
        setShowDetailsDialog={partners.setShowDetailsDialog}
        formatCurrency={partners.formatCurrency}
      />

      <AdminPartnerDetailsDialog
        t={partners.t}
        selectedPartner={partners.selectedPartner}
        showDetailsDialog={partners.showDetailsDialog}
        setShowDetailsDialog={partners.setShowDetailsDialog}
        vehicles={partners.vehicles}
        formatCurrency={partners.formatCurrency}
        formatDate={partners.formatDate}
        payoutProcessingId={partners.payoutProcessingId}
        handleMarkPayoutPaid={partners.handleMarkPayoutPaid}
        handleMarkRemittanceReceived={partners.handleMarkRemittanceReceived}
        handleRecalculatePayout={partners.handleRecalculatePayout}
        setSelectedDocument={partners.setSelectedDocument}
        setShowDocumentDialog={partners.setShowDocumentDialog}
        processing={partners.processing}
        handleFleetApprove={partners.handleFleetApprove}
        setSelectedVehicleId={partners.setSelectedVehicleId}
        setShowFleetRejectDialog={partners.setShowFleetRejectDialog}
        setShowFleetRemoveDialog={partners.setShowFleetRemoveDialog}
        setShowFleetDeleteDialog={partners.setShowFleetDeleteDialog}
        setShowRejectDialog={partners.setShowRejectDialog}
        handleApprove={partners.handleApprove}
        setShowSuspendDialog={partners.setShowSuspendDialog}
      />

      <AdminPartnerActionDialogs
        t={partners.t}
        showRejectDialog={partners.showRejectDialog}
        setShowRejectDialog={partners.setShowRejectDialog}
        rejectionReason={partners.rejectionReason}
        setRejectionReason={partners.setRejectionReason}
        handleReject={partners.handleReject}
        processing={partners.processing}
        showSuspendDialog={partners.showSuspendDialog}
        setShowSuspendDialog={partners.setShowSuspendDialog}
        suspensionReason={partners.suspensionReason}
        setSuspensionReason={partners.setSuspensionReason}
        handleSuspend={partners.handleSuspend}
        showDocumentDialog={partners.showDocumentDialog}
        setShowDocumentDialog={partners.setShowDocumentDialog}
        selectedDocument={partners.selectedDocument}
        showFleetRejectDialog={partners.showFleetRejectDialog}
        setShowFleetRejectDialog={partners.setShowFleetRejectDialog}
        fleetRejectionReason={partners.fleetRejectionReason}
        setFleetRejectionReason={partners.setFleetRejectionReason}
        selectedVehicleId={partners.selectedVehicleId}
        handleFleetReject={partners.handleFleetReject}
        showFleetRemoveDialog={partners.showFleetRemoveDialog}
        setShowFleetRemoveDialog={partners.setShowFleetRemoveDialog}
        handleFleetRemove={partners.handleFleetRemove}
        showFleetDeleteDialog={partners.showFleetDeleteDialog}
        setShowFleetDeleteDialog={partners.setShowFleetDeleteDialog}
        setSelectedVehicleId={partners.setSelectedVehicleId}
        handleFleetDelete={partners.handleFleetDelete}
      />
    </div>
  );
}
