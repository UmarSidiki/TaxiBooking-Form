"use client";

import { AdminPartnerDetailsDocuments } from "@/components/admin-partners/admin-partner-details-documents";
import { AdminPartnerDetailsFleet } from "@/components/admin-partners/admin-partner-details-fleet";
import { AdminPartnerDetailsProfile } from "@/components/admin-partners/admin-partner-details-profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { useAdminPartners } from "@/hooks/partners/useAdminPartners";
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
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
              />
              <AdminPartnerDetailsDocuments
                t={t}
                selectedPartner={selectedPartner}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                payoutProcessingId={payoutProcessingId}
                handleMarkPayoutPaid={handleMarkPayoutPaid}
                handleRecalculatePayout={handleRecalculatePayout}
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
                    <h3 className="font-semibold mb-2 text-red-600">
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
                  className="w-full sm:w-auto"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t("reject")}
                </Button>
                <Button
                  onClick={() => handleApprove(selectedPartner._id)}
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
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
                className="w-full sm:w-auto"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {t("suspend-partner")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
