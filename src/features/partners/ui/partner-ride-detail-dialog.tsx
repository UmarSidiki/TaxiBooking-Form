"use client";

import { PartnerRideDetailCustomer } from "@/features/partners/ui/partner-ride-detail-customer";
import { PartnerRideDetailJourney } from "@/features/partners/ui/partner-ride-detail-journey";
import { PartnerRideDetailPayment } from "@/features/partners/ui/partner-ride-detail-payment";
import type { usePartnerRides } from "@/features/rides/hooks/usePartnerRides";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useLocale } from "next-intl";

type PartnerRidesState = ReturnType<typeof usePartnerRides>;

export function PartnerRideDetailDialog({
  t,
  tRides,
  currencySymbol,
  detailBooking,
  setDetailBooking,
  isBookingPassed,
}: Pick<
  PartnerRidesState,
  "t" | "tRides" | "currencySymbol" | "detailBooking" | "setDetailBooking" | "isBookingPassed"
>) {
  const locale = useLocale();

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
                {tRides("Trip")} #{detailBooking.tripId.slice(0, 8)}
              </DialogTitle>
              <DialogDescription>
                {tRides("ScheduledFor")}{" "}
                {new Date(detailBooking.date).toLocaleDateString(locale, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                {detailBooking.time}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-2">
              <PartnerRideDetailJourney tRides={tRides} booking={detailBooking} />
              <PartnerRideDetailCustomer tRides={tRides} booking={detailBooking} />
            </div>
            {detailBooking.notes ? (
              <div className="rounded-md border border-border bg-card p-4">
                <p className="mb-1 font-semibold">{tRides("SpecialNotes")}</p>
                <p className="text-sm text-muted-foreground">{detailBooking.notes}</p>
              </div>
            ) : null}
            <PartnerRideDetailPayment
              t={t}
              tRides={tRides}
              currencySymbol={currencySymbol}
              booking={detailBooking}
              isPassed={isBookingPassed(detailBooking.date, detailBooking.time)}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
