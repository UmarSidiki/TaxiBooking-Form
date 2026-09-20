"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import type { IBooking } from "@/features/booking/model";
import { RideMapLine } from "@/features/rides/ui/ride-map-line";
import { RideStatusBadge } from "@/features/rides/ui/ride-status-badge";
import { MapPin } from "lucide-react";
import { useLocale, type useTranslations } from "next-intl";

function mapsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function DriverRideCard({
  booking,
  t,
  currencySymbol,
  isBookingPassed,
  setDetailBooking,
}: {
  booking: IBooking;
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
  setDetailBooking: (booking: IBooking) => void;
}) {
  const locale = useLocale();
  const dateLabel = new Date(booking.date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="desk-card overflow-hidden border border-border bg-card">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">
              {t("Dashboard.Rides.Trip")} #{booking.tripId.slice(0, 8)}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {booking.vehicleDetails?.name || booking.selectedVehicle}
            </p>
          </div>
          <RideStatusBadge
            booking={booking}
            isCompleted={isBookingPassed(booking.date, booking.time)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
          <p>
            <span className="text-muted-foreground">{t("Dashboard.Rides.Date")}</span>
            <span className="ms-2 font-medium">{dateLabel}</span>
          </p>
          <p>
            <span className="text-muted-foreground">{t("Dashboard.Rides.Time")}</span>
            <span className="ms-2 font-medium">{booking.time}</span>
          </p>
          <p>
            <span className="text-muted-foreground">{t("Drivers.passengers")}</span>
            <span className="ms-2 font-medium">{booking.passengers}</span>
          </p>
          <p>
            <span className="text-muted-foreground">{t("Dashboard.Rides.Price")}</span>
            <span className="ms-2 font-medium">
              {currencySymbol}
              {booking.totalAmount?.toFixed(2)}
            </span>
          </p>
        </div>
        <RideMapLine start={booking.pickup} end={booking.dropoff || "—"} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="h-11 flex-1" onClick={() => setDetailBooking(booking)}>
            {t("Dashboard.Rides.ViewDetails")}
          </Button>
          <Button className="h-11 flex-1" variant="outline" asChild>
            <a href={mapsUrl(booking.pickup)} target="_blank" rel="noreferrer">
              <MapPin className="size-4" />
              {t("Drivers.navigate")}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
