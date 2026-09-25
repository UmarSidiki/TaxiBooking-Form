"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { Button } from "@/shared/ui/button";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

export function PartnerDrawerFooter({
  t,
  selectedPartner,
  processing,
  handleApprove,
  setShowRejectDialog,
  setShowSuspendDialog,
}: Pick<
  AdminPartnersState,
  | "t"
  | "selectedPartner"
  | "processing"
  | "handleApprove"
  | "setShowRejectDialog"
  | "setShowSuspendDialog"
>) {
  const pending = selectedPartner?.status === "pending";
  const canSuspend =
    selectedPartner?.status === "approved" &&
    selectedPartner.fleetStatus !== "pending";

  if (!pending && !canSuspend) return null;

  return (
    <div className="flex-none border-t border-border/60 bg-card/50 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2.5">
        {pending ? (
          <>
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={processing}
              className="h-11 w-full rounded-xl sm:h-10 sm:w-auto"
            >
              <XCircle className="size-4" aria-hidden="true" />
              {t("reject")}
            </Button>
            <Button
              onClick={() =>
                selectedPartner && handleApprove(selectedPartner._id)
              }
              disabled={processing}
              className="h-11 w-full rounded-xl font-semibold sm:h-10 sm:w-auto"
            >
              {processing ? (
                <>
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                    aria-hidden="true"
                  />
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
        ) : null}
        {canSuspend ? (
          <Button
            variant="destructive"
            onClick={() => setShowSuspendDialog(true)}
            disabled={processing}
            className="h-11 w-full rounded-xl sm:h-10 sm:w-auto"
          >
            <XCircle className="size-4" aria-hidden="true" />
            {t("suspend-partner")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
