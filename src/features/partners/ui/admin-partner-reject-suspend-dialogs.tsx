"use client";

import { AdminPartnerDocumentStatusBadge } from "@/components/admin-partners/admin-partner-status-badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { useAdminPartners } from "@/hooks/partners/useAdminPartners";
import { FileText, XCircle } from "lucide-react";
import Image from "next/image";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

export function AdminPartnerRejectSuspendDialogs({
  t,
  showRejectDialog,
  setShowRejectDialog,
  rejectionReason,
  setRejectionReason,
  handleReject,
  processing,
  showSuspendDialog,
  setShowSuspendDialog,
  suspensionReason,
  setSuspensionReason,
  handleSuspend,
}: Pick<
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
>) {
  return (
    <>
      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reject-application")}</DialogTitle>
            <DialogDescription>
              {t("provide-rejection-reason")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder={t("enter-rejection-reason")}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing}
              className="w-full sm:w-auto"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("rejecting")}
                </>
              ) : (
                t("confirm-rejection")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("suspend-account")}</DialogTitle>
            <DialogDescription>
              {t("suspend-warning")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                <strong>{t("warning-label")}</strong> {t("data-deletion-notice")}
              </p>
            </div>
            <Textarea
              placeholder={t("enter-suspension-reason")}
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendDialog(false);
                setSuspensionReason("");
              }}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!suspensionReason.trim() || processing}
              className="w-full sm:w-auto"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("suspending")}
                </>
              ) : (
                t("confirm-suspension")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
