"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatStopWaitDuration } from "@/lib/rides/format-stop-wait-duration";
import type { IBooking } from "@/models/booking";
import {
  Baby,
  CalendarDays,
  Clock,
  MapPin,
  Navigation,
  Route,
  Users,
} from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideDetailJourney({
  booking,
  t,
}: {
  booking: IBooking;
  t: TFn;
}) {
  return (
                <Card className="border border-border shadow-sm bg-background">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <Route className="w-5 h-5 text-primary" />
                      {t("Dashboard.Rides.JourneyDetails")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-secondary-foreground" />
                        <span className="font-medium text-gray-700">
                          {t("Dashboard.Rides.PickupLocation")}
                        </span>
                      </div>
                      <p className="text-gray-600 ml-6 p-2 bg-secondary/10 rounded-lg">
                        {booking.pickup}
                      </p>
                    </div>

                    {booking.stops && booking.stops.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="w-4 h-4 text-secondary-foreground" />
                          <span className="font-medium text-gray-700">
                            {t("Dashboard.Rides.Stops")}
                          </span>
                        </div>
                        <div className="ml-6 space-y-2">
                          {booking.stops
                            .sort((a, b) => a.order - b.order)
                            .map((stop, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-2 text-sm text-gray-600 p-2 bg-secondary/10 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 bg-secondary/20 text-secondary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                  </span>
                                  <span>{stop.location}</span>
                                </div>
                                {stop.duration && stop.duration > 0 && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatStopWaitDuration(stop.duration)}
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-secondary-foreground" />
                        <span className="font-medium text-gray-700">
                          {t("Dashboard.Rides.DropoffLocation")}
                        </span>
                      </div>
                      <p className="text-gray-600 ml-6 p-2 bg-secondary/10 rounded-lg">
                        {booking.dropoff ||
                          t("Dashboard.Rides.NotSpecified")}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {booking.tripType === "roundtrip"
                              ? t("Dashboard.Rides.DepartureDate")
                              : t("Dashboard.Rides.Date")}
                          </p>
                          <p className="text-gray-600">{booking.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {booking.tripType === "roundtrip"
                              ? t("Dashboard.Rides.DepartureTime")
                              : t("Dashboard.Rides.Time")}
                          </p>
                          <p className="text-gray-600">{booking.time}</p>
                        </div>
                      </div>
                    </div>

                    {booking.tripType === "roundtrip" &&
                      booking.returnDate && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarDays className="w-4 h-4 text-secondary-foreground" />
                            <div>
                              <p className="font-medium text-gray-700">
                                {t("Dashboard.Rides.ReturnDate")}
                              </p>
                              <p className="text-gray-600">
                                {booking.returnDate}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-secondary-foreground" />
                            <div>
                              <p className="font-medium text-gray-700">
                                {t("Dashboard.Rides.ReturnTime")}
                              </p>
                              <p className="text-gray-600">
                                {booking.returnTime}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {t("Dashboard.Rides.Passengers")}
                          </p>
                          <p className="text-gray-600">
                            {booking.passengers}
                          </p>
                        </div>
                      </div>
                    </div>

                    {(booking.childSeats > 0 ||
                      booking.babySeats > 0) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-secondary/10 p-3 rounded-lg">
                        <Baby className="w-4 h-4" />
                        <span>
                          {booking.childSeats > 0 &&
                            t(
                              "Dashboard.Rides.detailbooking-childseats-child-seat-detailbooking-childseats-greater-than-1-s",
                              {
                                0: booking.childSeats,
                                1: booking.childSeats > 1 ? "s" : "",
                              }
                            )}
                          {booking.childSeats > 0 &&
                            booking.babySeats > 0 &&
                            " • "}
                          {booking.babySeats > 0 &&
                            t(
                              "Dashboard.Rides.detailbooking-babyseats-baby-seat-detailbooking-babyseats-greater-than-1-s",
                              {
                                0: booking.babySeats,
                                1: booking.babySeats > 1 ? "s" : "",
                              }
                            )}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
  );
}
