"use client";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { IBooking } from "@/features/booking/model";
import type { useTranslations } from "next-intl";
import { Ban, CreditCard, Loader2, Percent, RefreshCw, AlertTriangle } from "lucide-react";

export function AdminRideCancelDialog({
  t,
  currencySymbol,
  showCancelDialog,
  setShowCancelDialog,
  selectedBooking,
  refundPercentage,
  setRefundPercentage,
  cancelingId,
  handleCancelBooking,
  canRefund,
}: {
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
  showCancelDialog: boolean;
  setShowCancelDialog: (open: boolean) => void;
  selectedBooking: IBooking | null;
  refundPercentage: number;
  setRefundPercentage: (value: number) => void;
  cancelingId: string | null;
  handleCancelBooking: () => Promise<void>;
  canRefund: (booking: IBooking) => boolean | "" | undefined;
}) {
  return (
    <>
      {/* Cancel/Refund Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              {t("Dashboard.Rides.CancelRideAndProcessRefund")}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              <span className="font-semibold">
                {t("Dashboard.Rides.Trip")} #
                {selectedBooking?.tripId.slice(0, 8)}
              </span>
              <span className="text-gray-500 mx-2">•</span>
              <span>
                {selectedBooking?.firstName} {selectedBooking?.lastName}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-secondary/10 border-l-4 border-secondary/30 rounded-r-lg p-4">
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold block mb-1">
                    {t("Dashboard.Rides.WarningThisActionCannotBeUndone")}
                  </span>
                  {t("Dashboard.Rides.ThisWillPermanentlyCancelTheRide")}.{" "}
                  {selectedBooking &&
                    canRefund(selectedBooking) &&
                    t(
                      "Dashboard.Rides.ARefundWillBeProcessedAutomaticallyToTheCustomer"
                    )}
                </span>
              </p>
            </div>

            {selectedBooking && canRefund(selectedBooking) && (
              <div className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  {t("Dashboard.Rides.RefundPercentage")}
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={refundPercentage}
                    onChange={(e) =>
                      setRefundPercentage(
                        Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    className="w-24 text-center font-bold text-lg"
                  />
                  <span className="text-lg font-semibold text-gray-600">%</span>
                  <div className="flex-1">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={refundPercentage}
                      onChange={(e) =>
                        setRefundPercentage(parseInt(e.target.value))
                      }
                      className="w-full cursor-pointer"
                    />
                  </div>
                </div>
                <div className="p-3 bg-secondary/20 rounded-md border border-secondary/30">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 flex items-center gap-1">
                      <RefreshCw className="w-4 h-4" />
                      {t("Dashboard.Rides.RefundAmount")}
                    </span>
                    <span className="font-bold text-xl text-gray-900">
                      {currencySymbol}
                      {(
                        (selectedBooking?.totalAmount || 0) *
                        (refundPercentage / 100)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>{t("Dashboard.Rides.TotalAmount")}</span>
                    <span>
                      {currencySymbol}
                      {selectedBooking?.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedBooking?.paymentMethod === "cash" && (
              <div className="bg-secondary/10 border-l-4 border-secondary/30 rounded-r-lg p-4">
                <p className="text-sm text-gray-700 flex items-start gap-2">
                  <CreditCard className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold block mb-1">
                      {t("Dashboard.Rides.CashPayment")}
                    </span>
                    {t(
                      "Dashboard.Rides.PaymentMethodIsCashNoOnlineRefundWillBeProcessedYouMayNeedToHandleTheRefundManually"
                    )}
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("Dashboard.Rides.KeepRide")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={cancelingId !== null}
              className="w-full sm:w-auto"
            >
              {cancelingId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("Dashboard.Rides.Processing")}
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  {t("Dashboard.Rides.ConfirmCancellation")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
