"use client";

import { DriverRideDetailJourney } from "@/features/rides/ui/driver-ride-detail-journey";
import { DriverRideDetailPassenger } from "@/features/rides/ui/driver-ride-detail-passenger";
import { DriverRideDetailPayment } from "@/features/rides/ui/driver-ride-detail-payment";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { useDriverDashboard } from "@/features/drivers/hooks/useDriverDashboard";
import { Car, Info } from "lucide-react";

type DriverDashboardState = ReturnType<typeof useDriverDashboard>;

export function DriverRideDetailDialog({
  t,
  currencySymbol,
  detailBooking,
  setDetailBooking,
  isBookingPassed,
}: Pick<
  DriverDashboardState,
  "t" | "currencySymbol" | "detailBooking" | "setDetailBooking" | "isBookingPassed"
>) {
  return (
    <>
      {/* Detail Dialog */}
      <Dialog
        open={Boolean(detailBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailBooking(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailBooking && (
            <div className="space-y-6">
              <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      detailBooking.status === "canceled"
                        ? "bg-destructive/10"
                        : new Date(detailBooking.date) < new Date()
                        ? "bg-muted/10"
                        : "bg-primary/10"
                    }`}
                  >
                    <Car
                      className={`w-6 h-6 ${
                        detailBooking.status === "canceled"
                          ? "text-destructive"
                          : new Date(detailBooking.date) < new Date()
                          ? "text-muted-foreground"
                          : "text-primary"
                      }`}
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      {t("Dashboard.Rides.Trip")} #
                      {detailBooking.tripId.slice(0, 8)}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 mt-1">
                      {t("Dashboard.Rides.ScheduledFor")}{" "}
                      {new Date(detailBooking.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}{" "}
                      at {detailBooking.time}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Journey Details */}
                <DriverRideDetailJourney t={t} detailBooking={detailBooking} />

                {/* Customer Information */}
                <DriverRideDetailPassenger t={t} detailBooking={detailBooking} />
              </div>

              {/* Special Notes */}
              {detailBooking.notes && (
                <Card className="border border-border bg-secondary/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          {t("Dashboard.Rides.SpecialNotes")}
                        </p>
                        <p className="text-gray-700">{detailBooking.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DriverRideDetailPayment
                t={t}
                currencySymbol={currencySymbol}
                detailBooking={detailBooking}
                isBookingPassed={isBookingPassed}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
