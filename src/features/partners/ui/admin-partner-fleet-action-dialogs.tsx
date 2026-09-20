"use client";

import { AdminPartnerDocumentStatusBadge } from "@/features/partners/ui/admin-partner-status-badges";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { FileText, XCircle } from "lucide-react";
import Image from "next/image";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

export function AdminPartnerFleetActionDialogs({
  t,
  showFleetRejectDialog,
  setShowFleetRejectDialog,
  fleetRejectionReason,
  setFleetRejectionReason,
  selectedVehicleId,
  handleFleetReject,
  processing,
  showFleetRemoveDialog,
  setShowFleetRemoveDialog,
  handleFleetRemove,
  showFleetDeleteDialog,
  setShowFleetDeleteDialog,
  setSelectedVehicleId,
  handleFleetDelete,
}: Pick<
  AdminPartnersState,
  | "t"
  | "showFleetRejectDialog"
  | "setShowFleetRejectDialog"
  | "fleetRejectionReason"
  | "setFleetRejectionReason"
  | "selectedVehicleId"
  | "handleFleetReject"
  | "processing"
  | "showFleetRemoveDialog"
  | "setShowFleetRemoveDialog"
  | "handleFleetRemove"
  | "showFleetDeleteDialog"
  | "setShowFleetDeleteDialog"
  | "setSelectedVehicleId"
  | "handleFleetDelete"
>) {
  return (
    <>
      {/* Fleet Reject Dialog */}
      <Dialog open={showFleetRejectDialog} onOpenChange={setShowFleetRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reject-fleet-request")}</DialogTitle>
            <DialogDescription>
              {t("provide-fleet-rejection-reason")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder={t("enter-fleet-rejection-reason")}
              value={fleetRejectionReason}
              onChange={(e) => setFleetRejectionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowFleetRejectDialog(false);
                setFleetRejectionReason("");
              }}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedVehicleId && handleFleetReject(selectedVehicleId)}
              disabled={!fleetRejectionReason.trim() || processing}
              className="w-full sm:w-auto"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("rejecting")}
                </>
              ) : (
                t("confirm-fleet-rejection")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fleet Remove Dialog */}
      <Dialog open={showFleetRemoveDialog} onOpenChange={setShowFleetRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("remove-fleet-assignment")}</DialogTitle>
            <DialogDescription>
              {t("confirm-remove-partner-fleet")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFleetRemoveDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedVehicleId && handleFleetRemove(selectedVehicleId)}
              disabled={processing}
              className="w-full sm:w-auto"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("removing")}
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  {t("remove-fleet")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fleet Delete Dialog */}
      <Dialog open={showFleetDeleteDialog} onOpenChange={setShowFleetDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete-fleet-request")}</DialogTitle>
            <DialogDescription>
              {t("confirm-delete-fleet-request")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowFleetDeleteDialog(false);
                setSelectedVehicleId(null);
              }}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleFleetDelete}
              disabled={processing}
              className="w-full sm:w-auto"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("deleting")}
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  {t("delete")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
