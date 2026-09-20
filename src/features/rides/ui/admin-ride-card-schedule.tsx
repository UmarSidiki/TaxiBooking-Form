"use client";

import type { IBooking } from "@/features/booking/model";
import { CalendarDays, Clock, DollarSign, Users } from "lucide-react";
import type { useTranslations } from "next-intl";

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
  return (
    <>
            {/* Trip Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CalendarDays className="w-3 h-3" />
                  {booking.tripType === "roundtrip"
                    ? t("Dashboard.Rides.DepartureDate")
                    : t("Dashboard.Rides.Date")}
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(booking.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {booking.tripType === "roundtrip"
                    ? t("Dashboard.Rides.DepartureTime")
                    : t("Dashboard.Rides.Time")}
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {booking.time}
                </p>
              </div>
              {booking.tripType === "roundtrip" && booking.returnDate ? (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays className="w-3 h-3" />
                      {t("Dashboard.Rides.ReturnDate")}
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(booking.returnDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {t("Dashboard.Rides.ReturnTime")}
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.returnTime}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      {t("Dashboard.Rides.Passengers")}
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.passengers}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <DollarSign className="w-3 h-3" />
                      {t("Dashboard.Rides.Price")}
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {currencySymbol}
                      {booking.totalAmount?.toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Second row for Passengers and Price on roundtrip bookings */}
            {booking.tripType === "roundtrip" && booking.returnDate && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    {t("Dashboard.Rides.Passengers")}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {booking.passengers}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <DollarSign className="w-3 h-3" />
                    {t("Dashboard.Rides.Price")}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {currencySymbol}
                    {booking.totalAmount?.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
    </>
  );
}
