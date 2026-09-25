"use client";

import { PartnerRideCard } from "@/features/partners/ui/partner-ride-card";
import { PartnerRideDetailDialog } from "@/features/partners/ui/partner-ride-detail-dialog";
import { usePartnerRides } from "@/features/rides/hooks/usePartnerRides";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { Button } from "@/shared/ui/button";
import { Car, Loader2 } from "lucide-react";

export default function PartnerRidesPage() {
  const rides = usePartnerRides();
  const {
    t,
    tRides,
    currencySymbol,
    loading,
    loadError,
    fetchRides,
    detailBooking,
    setDetailBooking,
    isBookingPassed,
    upcomingBookings,
  } = rides;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mb-4 size-8 animate-spin text-primary" />
        <p className="text-sm">{t("rides")}…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DeskPageMeta
        title={t("rides")}
        description={t("your-upcoming-scheduled-rides")}
      />
      {loadError ? (
        <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="alert">
          {loadError}
          <Button variant="outline" className="ms-3 h-11" onClick={() => void fetchRides()}>
            {t("retry")}
          </Button>
        </p>
      ) : upcomingBookings.length === 0 ? (
        <div className="rounded-md border border-border bg-card py-12 text-center text-muted-foreground">
          <Car className="mx-auto mb-3 size-12 opacity-50" />
          <p>{t("no-upcoming-rides-found")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {upcomingBookings.map((booking) => (
            <PartnerRideCard
              key={booking._id}
              booking={booking}
              t={t}
              currencySymbol={currencySymbol}
              isBookingPassed={isBookingPassed}
              setDetailBooking={setDetailBooking}
            />
          ))}
        </div>
      )}
      <PartnerRideDetailDialog
        t={t}
        tRides={tRides}
        currencySymbol={currencySymbol}
        detailBooking={detailBooking}
        setDetailBooking={setDetailBooking}
        isBookingPassed={isBookingPassed}
      />
    </div>
  );
}
