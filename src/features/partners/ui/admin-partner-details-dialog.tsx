"use client";

import { AdminPartnerDetailsBilling } from "@/features/partners/ui/admin-partner-details-billing";
import { AdminPartnerDetailsDocuments } from "@/features/partners/ui/admin-partner-details-documents";
import { AdminPartnerDetailsFleet } from "@/features/partners/ui/admin-partner-details-fleet";
import { AdminPartnerDetailsProfile } from "@/features/partners/ui/admin-partner-details-profile";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { CheckCircle2, XCircle } from "lucide-react";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

export function AdminPartnerDetailsDialog({
  t,
  selectedPartner,
  showDetailsDialog,
  setShowDetailsDialog,
  vehicles,
  formatCurrency,
  formatDate,
  payoutProcessingId,
  handleMarkPayoutPaid,
  handleRecalculatePayout,
  setSelectedDocument,
  setShowDocumentDialog,
  processing,
  handleFleetApprove,
  setSelectedVehicleId,
  setShowFleetRejectDialog,
  setShowFleetRemoveDialog,
  setShowFleetDeleteDialog,
  setShowRejectDialog,
  handleApprove,
  setShowSuspendDialog,
}: Pick<
  AdminPartnersState,
  | "t"
  | "selectedPartner"
  | "showDetailsDialog"
  | "setShowDetailsDialog"
  | "vehicles"
  | "formatCurrency"
  | "formatDate"
  | "payoutProcessingId"
  | "handleMarkPayoutPaid"
  | "handleRecalculatePayout"
  | "setSelectedDocument"
  | "setShowDocumentDialog"
  | "processing"
  | "handleFleetApprove"
  | "setSelectedVehicleId"
  | "setShowFleetRejectDialog"
  | "setShowFleetRemoveDialog"
  | "setShowFleetDeleteDialog"
  | "setShowRejectDialog"
  | "handleApprove"
  | "setShowSuspendDialog"
>) {
  return (
    <>
      {/* Partner Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle>{t("partner-details")}</DialogTitle>
            <DialogDescription>
              {t("review-partner-info")}
            </DialogDescription>
          </DialogHeader>

          {selectedPartner && (
            <div className="space-y-6">
              <AdminPartnerDetailsProfile
                t={t}
                selectedPartner={selectedPartner}
                formatCurrency={formatCurrency}
              />
              <AdminPartnerDetailsBilling
                t={t}
                selectedPartner={selectedPartner}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                payoutProcessingId={payoutProcessingId}
                handleMarkPayoutPaid={handleMarkPayoutPaid}
                handleRecalculatePayout={handleRecalculatePayout}
              />
              <AdminPartnerDetailsDocuments
                t={t}
                selectedPartner={selectedPartner}
                setSelectedDocument={setSelectedDocument}
                setShowDocumentDialog={setShowDocumentDialog}
              />
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

              {/* Rejection Reason */}
              {selectedPartner.status === "rejected" &&
                selectedPartner.rejectionReason && (
                  <div>
                    <h3 className="mb-2 font-semibold text-destructive">
                      {t("partner-rejection-reason")}
                    </h3>
                    <p className="text-sm">{selectedPartner.rejectionReason}</p>
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {/* Partner Status Actions */}
            {selectedPartner?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={processing}
                  className="min-h-11 w-full sm:w-auto"
                >
                  <XCircle className="size-4" aria-hidden="true" />
                  {t("reject")}
                </Button>
                <Button
                  onClick={() => handleApprove(selectedPartner._id)}
                  disabled={processing}
                  className="min-h-11 w-full sm:w-auto"
                >
                  {processing ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" aria-hidden="true" />
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      {t("approve-partner")}
                    </>
                  )}
                </Button>
              </>
            )}
            {selectedPartner?.status === "approved" && selectedPartner.fleetStatus !== "pending" && (
              <Button
                variant="destructive"
                onClick={() => setShowSuspendDialog(true)}
                disabled={processing}
                className="min-h-11 w-full sm:w-auto"
              >
                <XCircle className="size-4" aria-hidden="true" />
                {t("suspend-partner")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
