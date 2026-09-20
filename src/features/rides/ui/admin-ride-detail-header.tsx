"use client";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LONG_EN_US_DATE } from "@/lib/rides/ride-format";
import type { IBooking } from "@/models/booking";
import { Car } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideDetailHeader({
  booking,
  t,
  isBookingPassed,
}: {
  booking: IBooking;
  t: TFn;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
}) {
  return (
              <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      booking.status === "canceled"
                        ? "bg-destructive/10"
                        : isBookingPassed(booking.date, booking.time)
                        ? "bg-muted/10"
                        : "bg-primary/10"
                    }`}
                  >
                    <Car
                      className={`w-6 h-6 ${
                        booking.status === "canceled"
                          ? "text-destructive"
                          : isBookingPassed(booking.date, booking.time)
                          ? "text-muted-foreground"
                          : "text-primary"
                      }`}
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      {t("Dashboard.Rides.Trip")} #
                      {booking.tripId.slice(0, 8)}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 mt-1">
                      {booking.tripType === "roundtrip" ? (
                        <>
                          {t("Dashboard.Rides.departure")}:{" "}
                          {new Date(booking.date).toLocaleDateString(
                            "en-US",
                            LONG_EN_US_DATE
                          )}{" "}
                          at {booking.time}
                          {booking.returnDate && (
                            <>
                              <br />
                              {t("Dashboard.Rides.return")}:{" "}
                              {new Date(
                                booking.returnDate
                              ).toLocaleDateString("en-US", LONG_EN_US_DATE)}{" "}
                              at {booking.returnTime}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {t("Dashboard.Rides.ScheduledFor")}{" "}
                          {new Date(booking.date).toLocaleDateString(
                            "en-US",
                            LONG_EN_US_DATE
                          )}{" "}
                          at {booking.time}
                        </>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
  );
}
