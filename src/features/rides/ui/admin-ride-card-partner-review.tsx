"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import type { IBooking } from "@/features/booking/model";
import { CheckCircle, Edit } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideCardPartnerReview({
  booking,
  t,
  isPartnerReviewPending,
  setPartnerMargin,
  setShowPartnerApprovalModal,
}: {
  booking: IBooking;
  t: TFn;
  isPartnerReviewPending: boolean;
  setPartnerMargin: Dispatch<SetStateAction<number>>;
  setShowPartnerApprovalModal: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <div className="border-t border-border pt-3">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <CheckCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              {t("Dashboard.Rides.partner-review-title")}
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={isPartnerReviewPending ? "destructive" : "secondary"} className="text-xs">
                {isPartnerReviewPending
                  ? t("Dashboard.Rides.partner-review-status-pending")
                  : t("Dashboard.Rides.partner-review-status-approved")}
              </Badge>
              {!isPartnerReviewPending ? (
                <span className="text-xs text-muted-foreground">
                  {t("Dashboard.Rides.margin-percentage")}: {booking.partnerMarginPercentage || 0}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <Button
          className="h-11 w-full sm:w-auto"
          variant={isPartnerReviewPending ? "default" : "outline"}
          onClick={() => {
            setPartnerMargin(booking.partnerMarginPercentage ?? 0);
            setShowPartnerApprovalModal(true);
          }}
        >
          {isPartnerReviewPending ? (
            <CheckCircle className="size-4" />
          ) : (
            <Edit className="size-4" />
          )}
          {isPartnerReviewPending
            ? t("Dashboard.Rides.approve-for-partners")
            : t("Dashboard.Rides.edit-partner-margin")}
        </Button>
      </div>
    </div>
  );
}
