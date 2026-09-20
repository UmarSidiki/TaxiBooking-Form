"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { AdminRideCardDialogsProps } from "@/features/rides/ui/admin-ride-card-dialogs.types";
import { CheckCircle, Loader2 } from "lucide-react";

type Props = Pick<
  AdminRideCardDialogsProps,
  | "t"
  | "booking"
  | "bookingId"
  | "currencySymbol"
  | "totalAmountValue"
  | "partnerMargin"
  | "setPartnerMargin"
  | "marginPreviewAmount"
  | "partnerPayoutPreview"
  | "approvalButtonLabel"
  | "isApprovingThisBooking"
  | "isPartnerReviewPending"
  | "showPartnerApprovalModal"
  | "setShowPartnerApprovalModal"
  | "handleApprovePartnerReview"
>;

export function AdminRidePartnerApprovalDialog({
  t,
  booking,
  bookingId,
  currencySymbol,
  totalAmountValue,
  partnerMargin,
  setPartnerMargin,
  marginPreviewAmount,
  partnerPayoutPreview,
  approvalButtonLabel,
  isApprovingThisBooking,
  isPartnerReviewPending,
  showPartnerApprovalModal,
  setShowPartnerApprovalModal,
  handleApprovePartnerReview,
}: Props) {
  return (
        <Dialog open={showPartnerApprovalModal} onOpenChange={setShowPartnerApprovalModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="line-clamp-2">{t("Dashboard.Rides.partner-review-title")}</span>
              </DialogTitle>
              <DialogDescription className="text-sm ">
                {t("Dashboard.Rides.partner-review-description")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trip ID</span>
                  <span className="font-medium">#{booking.tripId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="font-semibold text-base sm:text-lg">{currencySymbol}{totalAmountValue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Status</span>
                  <Badge variant={isPartnerReviewPending ? "destructive" : "secondary"} className="text-xs text-white">
                    {isPartnerReviewPending ? "Pending Approval" : "Approved"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">
                    {t("Dashboard.Rides.margin-percentage")}
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={partnerMargin}
                      onChange={(event) => setPartnerMargin(Number(event.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set the margin percentage to keep from the total booking amount
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("Dashboard.Rides.admin-margin-amount")}
                    </Label>
                    <p className="text-lg sm:text-xl font-bold text-primary mt-1">
                      {currencySymbol}{marginPreviewAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("Dashboard.Rides.partner-payout-amount")}
                    </Label>
                    <p className="text-lg sm:text-xl font-bold text-green-600 mt-1">
                      {currencySymbol}{partnerPayoutPreview.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPartnerApprovalModal(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const success = await handleApprovePartnerReview(bookingId, partnerMargin);
                  if (success) {
                    setShowPartnerApprovalModal(false);
                  }
                }}
                disabled={partnerMargin < 0 || partnerMargin > 100 || isApprovingThisBooking}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                {isApprovingThisBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("Dashboard.Rides.approving")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {approvalButtonLabel}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  );
}
