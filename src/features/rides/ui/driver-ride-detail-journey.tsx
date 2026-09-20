"use client";

import { RideMapLine } from "@/components/rides/ride-map-line";
import { RidePaymentStatusBadge } from "@/components/rides/ride-payment-status-badge";
import { RideStatusBadge } from "@/components/rides/ride-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IBooking } from "@/models/booking";
import type { useDriverDashboard } from "@/hooks/rides/useDriverDashboard";
import {
  Baby,
  Ban,
  Calendar,
  Car,
  Clock,
  CreditCard,
  DollarSign,
  Info,
  Mail,
  MapPin,
  Navigation,
  PhoneCall,
  Plane,
  Receipt,
  RefreshCw,
  Route,
  User,
  UserCheck,
  Users,
} from "lucide-react";

type DriverDashboardState = ReturnType<typeof useDriverDashboard>;
type TFn = DriverDashboardState["t"];
type Booking = NonNullable<DriverDashboardState["detailBooking"]>;

export function DriverRideDetailJourney({
  t,
  detailBooking,
}: {
  t: TFn;
  detailBooking: Booking;
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
                        {detailBooking.pickup}
                      </p>
                    </div>

                    {detailBooking.stops && detailBooking.stops.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="w-4 h-4 text-secondary-foreground" />
                          <span className="font-medium text-gray-700">
                            {t("Dashboard.Rides.Stops")}
                          </span>
                        </div>
                        <div className="ml-6 space-y-2">
                          {detailBooking.stops
                            .sort((a, b) => a.order - b.order)
                            .map((stop, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-secondary/10 rounded-lg"
                              >
                                <span className="w-6 h-6 bg-secondary/20 text-secondary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </span>
                                <span>{stop.location}</span>
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
                        {detailBooking.dropoff ||
                          t("Dashboard.Rides.NotSpecified")}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {t("Dashboard.Rides.Time")}
                          </p>
                          <p className="text-gray-600">{detailBooking.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {t("Dashboard.Rides.Passengers")}
                          </p>
                          <p className="text-gray-600">
                            {detailBooking.passengers}
                          </p>
                        </div>
                      </div>
                    </div>

                    {(detailBooking.childSeats > 0 ||
                      detailBooking.babySeats > 0) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-secondary/10 p-3 rounded-lg">
                        <Baby className="w-4 h-4" />
                        <span>
                          {detailBooking.childSeats > 0 &&
                            t(
                              "Drivers.detailbooking-childseats-child-seat-detailbooking-childseats-greater-than-1-s",
                              {
                                0: detailBooking.childSeats,
                                1: detailBooking.childSeats > 1 ? "s" : "",
                              }
                            )}
                          {detailBooking.childSeats > 0 &&
                            detailBooking.babySeats > 0 &&
                            " • "}
                          {detailBooking.babySeats > 0 &&
                            t(
                              "Drivers.detailbooking-babyseats-baby-seat-detailbooking-babyseats-greater-than-1-s",
                              {
                                0: detailBooking.babySeats,
                                1: detailBooking.babySeats > 1 ? "s" : "",
                              }
                            )}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

  );
}
