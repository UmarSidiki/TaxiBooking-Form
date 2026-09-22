"use client";

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
      <div className="space-y-6" role="status">
        <span className="sr-only">{t("title")}…</span>
        <div className="h-16 w-64 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="alert">
        {loadError}
        <button
          type="button"
          className="ms-3 min-h-11 rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={() => void partners.fetchPartners()}
        >
          {t("retry")}
        </button>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>
      {partners.notice ? (
        <p
          className="rounded-md border border-border bg-card px-4 py-3 text-sm"
          role="status"
        >
          {partners.notice}
          <button
            type="button"
            className="ms-3 min-h-11 rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => partners.setNotice(null)}
          >
            {t("dismiss")}
          </button>
        </p>
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
