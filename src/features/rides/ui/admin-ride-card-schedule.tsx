"use client";

import type { IBooking } from "@/features/booking/model";
import { SHORT_DATE } from "@/features/rides/lib/ride-format";
import { Users } from "lucide-react";
import { useLocale, type useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideCardSchedule({
  booking,
  t,
  currencySymbol,
}: {
  booking: IBooking;
  t: TFn;
  currencySymbol: string;
}) {
  const locale = useLocale();
  const date = new Date(booking.date).toLocaleDateString(locale, SHORT_DATE);
  const roundtrip = booking.tripType === "roundtrip" && booking.returnDate;
  const price = `${currencySymbol}${booking.totalAmount?.toFixed(2) ?? "0.00"}`;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <p className="font-medium tabular-nums text-foreground">
        <span className="text-muted-foreground">{date}</span>
        <span className="mx-1.5 text-muted-foreground/50" aria-hidden="true">
          ·
        </span>
        <span>{booking.time}</span>
      </p>
      {roundtrip ? (
        <p className="text-xs text-muted-foreground">
          {t("Dashboard.Rides.ReturnDate")}{" "}
          <span className="font-medium text-foreground">
            {new Date(booking.returnDate as string).toLocaleDateString(
              locale,
              SHORT_DATE
            )}{" "}
            {booking.returnTime}
          </span>
        </p>
      ) : null}
      <p className="ms-auto text-sm font-semibold tabular-nums text-foreground">
        {price}
      </p>
      <p
        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        title={t("Dashboard.Rides.Passengers")}
      >
        <Users className="size-3" aria-hidden="true" />
        <span className="tabular-nums">{booking.passengers}</span>
      </p>
    </div>
  );
}
