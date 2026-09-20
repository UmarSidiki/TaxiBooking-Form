"use client";

import { DriverRideDetailJourney } from "@/features/rides/ui/driver-ride-detail-journey";
import { DriverRideDetailPassenger } from "@/features/rides/ui/driver-ride-detail-passenger";
import { DriverRideDetailPayment } from "@/features/rides/ui/driver-ride-detail-payment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { useDriverDashboard } from "@/features/drivers/hooks/useDriverDashboard";
import { Button } from "@/shared/ui/button";
import { MapPin } from "lucide-react";
import { useLocale } from "next-intl";

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
  const locale = useLocale();
  const mapsUrl = detailBooking
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(detailBooking.pickup)}`
    : "";

  return (
    <Dialog
      open={Boolean(detailBooking)}
      onOpenChange={(open) => {
        if (!open) setDetailBooking(null);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        {detailBooking ? (
          <div className="space-y-6">
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                {t("Dashboard.Rides.Trip")} #{detailBooking.tripId.slice(0, 8)}
              </DialogTitle>
              <DialogDescription>
                {t("Dashboard.Rides.ScheduledFor")}{" "}
                {new Date(detailBooking.date).toLocaleDateString(locale, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                {detailBooking.time}
              </DialogDescription>
              <Button className="mt-3 h-11 w-fit" variant="outline" asChild>
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <MapPin className="size-4" />
                  {t("Drivers.navigate")}
                </a>
              </Button>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-2">
              <DriverRideDetailJourney t={t} detailBooking={detailBooking} />
              <DriverRideDetailPassenger t={t} detailBooking={detailBooking} />
            </div>
            {detailBooking.notes ? (
              <div className="rounded-md border border-border bg-card p-4">
                <p className="mb-1 font-semibold">{t("Dashboard.Rides.SpecialNotes")}</p>
                <p className="text-sm text-muted-foreground">{detailBooking.notes}</p>
              </div>
            ) : null}
            <DriverRideDetailPayment
              t={t}
              currencySymbol={currencySymbol}
              detailBooking={detailBooking}
              isBookingPassed={isBookingPassed}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
