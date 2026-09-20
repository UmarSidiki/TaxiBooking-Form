"use client";

import type { IBooking } from "@/features/booking/model";
import { SHORT_DATE } from "@/features/rides/lib/ride-format";
import { CalendarDays, Clock, DollarSign, Users } from "lucide-react";
import { useLocale, type useTranslations } from "next-intl";
import type { ReactNode } from "react";

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
  const dateLabel =
    booking.tripType === "roundtrip"
      ? t("Dashboard.Rides.DepartureDate")
      : t("Dashboard.Rides.Date");
  const timeLabel =
    booking.tripType === "roundtrip"
      ? t("Dashboard.Rides.DepartureTime")
      : t("Dashboard.Rides.Time");
  const roundtrip = booking.tripType === "roundtrip" && booking.returnDate;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<CalendarDays className="size-3" />}
          label={dateLabel}
          value={new Date(booking.date).toLocaleDateString(locale, SHORT_DATE)}
        />
        <Stat icon={<Clock className="size-3" />} label={timeLabel} value={booking.time} />
        {roundtrip ? (
          <>
            <Stat
              icon={<CalendarDays className="size-3" />}
              label={t("Dashboard.Rides.ReturnDate")}
              value={new Date(booking.returnDate as string).toLocaleDateString(
                locale,
                SHORT_DATE
              )}
            />
            <Stat
              icon={<Clock className="size-3" />}
              label={t("Dashboard.Rides.ReturnTime")}
              value={booking.returnTime ?? ""}
            />
          </>
        ) : (
          <>
            <Stat
              icon={<Users className="size-3" />}
              label={t("Dashboard.Rides.Passengers")}
              value={String(booking.passengers)}
            />
            <Stat
              icon={<DollarSign className="size-3" />}
              label={t("Dashboard.Rides.Price")}
              value={`${currencySymbol}${booking.totalAmount?.toFixed(2)}`}
            />
          </>
        )}
      </div>
      {roundtrip ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Users className="size-3" />}
            label={t("Dashboard.Rides.Passengers")}
            value={String(booking.passengers)}
          />
          <Stat
            icon={<DollarSign className="size-3" />}
            label={t("Dashboard.Rides.Price")}
            value={`${currencySymbol}${booking.totalAmount?.toFixed(2)}`}
          />
        </div>
      ) : null}
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
