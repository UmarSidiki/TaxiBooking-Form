"use client";

import type { IBooking } from "@/models/booking";
import { Baby, Info, Plane, Users } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideCardExtras({
  booking,
  t,
}: {
  booking: IBooking;
  t: TFn;
}) {
  return (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">Passengers:</span>
                  <span className="font-medium text-gray-900">
                    {booking.passengers}
                  </span>
                </div>
                {booking.childSeats > 0 && (
                  <div className="flex items-center gap-2">
                    <Baby className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {t("Dashboard.Rides.child-seats")}
                    </span>
                    <span className="font-medium text-gray-900">
                      {booking.childSeats}
                    </span>
                  </div>
                )}
                {booking.babySeats > 0 && (
                  <div className="flex items-center gap-2">
                    <Baby className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {t("Dashboard.Rides.baby-seats")}
                    </span>
                    <span className="font-medium text-gray-900">
                      {booking.babySeats}
                    </span>
                  </div>
                )}
                {booking.flightNumber && (
                  <div className="flex items-center gap-2">
                    <Plane className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">
                      {t("Dashboard.Rides.flight-number")}
                    </span>
                    <span className="font-medium text-gray-900">
                      {booking.flightNumber}
                    </span>
                  </div>
                )}
              </div>
              {booking.notes && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-3 h-3 text-secondary-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-secondary-foreground">
                        {t("Dashboard.Rides.special-requests")}{" "}
                      </span>
                      <p className="text-xs text-secondary-foreground mt-1">
                        {booking.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
  );
}
