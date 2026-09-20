"use client";

import type { IBooking } from "@/features/booking/model";
import { LONG_DATE } from "@/features/rides/lib/ride-format";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useLocale, type useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideDetailHeader({
  booking,
  t,
}: {
  booking: IBooking;
  t: TFn;
}) {
  const locale = useLocale();
  const departure = new Date(booking.date).toLocaleDateString(locale, LONG_DATE);

  return (
    <DialogHeader className="border-b border-border pb-4">
      <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
        {t("Dashboard.Rides.Trip")} #{booking.tripId.slice(0, 8)}
      </DialogTitle>
      <DialogDescription className="text-muted-foreground">
        {booking.tripType === "roundtrip" ? (
          <>
            {t("Dashboard.Rides.departure")}: {departure} {booking.time}
            {booking.returnDate ? (
              <>
                <br />
                {t("Dashboard.Rides.return")}:{" "}
                {new Date(booking.returnDate).toLocaleDateString(locale, LONG_DATE)}{" "}
                {booking.returnTime}
              </>
            ) : null}
          </>
        ) : (
          <>
            {t("Dashboard.Rides.ScheduledFor")} {departure} {booking.time}
          </>
        )}
      </DialogDescription>
    </DialogHeader>
  );
}
