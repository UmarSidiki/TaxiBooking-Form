"use client";

import { RideMapLine } from "@/components/rides/ride-map-line";
import type { IBooking } from "@/models/booking";
import { ChevronRight, Route } from "lucide-react";
import { Fragment } from "react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideCardRoute({
  booking,
  t,
}: {
  booking: IBooking;
  t: TFn;
}) {
  return (
            <div className="bg-secondary/10 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Route className="w-4 h-4 text-secondary-foreground" />
                <span className="text-secondary-foreground font-medium">
                  {t("Dashboard.Rides.Route")}:
                </span>
                {booking.stops && booking.stops.length > 0 ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span
                      className="max-w-[6rem] truncate"
                      title={booking.pickup}
                    >
                      {booking.pickup}
                    </span>
                    {booking.stops
                      .sort((a, b) => a.order - b.order)
                      .map((stop, index) => (
                        <Fragment key={index}>
                          <ChevronRight className="h-3 w-3 text-secondary-foreground/50" />
                          <span
                            className="max-w-[6rem] truncate"
                            title={stop.location}
                          >
                            {stop.location}
                          </span>
                        </Fragment>
                      ))}
                    {booking.dropoff && (
                      <>
                        <ChevronRight className="h-3 w-3 text-secondary-foreground/50" />
                        <span
                          className="max-w-[6rem] truncate"
                          title={booking.dropoff}
                        >
                          {booking.dropoff}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <RideMapLine
                    start={booking.pickup}
                    end={booking.dropoff || "N/A"}
                  />
                )}
              </div>
            </div>
  );
}
