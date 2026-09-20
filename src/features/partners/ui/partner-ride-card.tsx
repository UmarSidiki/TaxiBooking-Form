"use client";

import {
  PartnerRideStatusBadge,
} from "@/features/partners/ui/partner-ride-badges";
import type { PartnerRideBooking } from "@/features/partners/ui/partner-ride.types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import type { usePartnerRides } from "@/features/rides/hooks/usePartnerRides";
import {
  Baby,
  Calendar,
  Car,
  ChevronRight,
  Clock,
  Eye,
  Mail,
  MapPin,
  Phone,
  Plane,
  Users,
} from "lucide-react";

type PartnerRidesState = ReturnType<typeof usePartnerRides>;
type TFn = PartnerRidesState["t"];

export function PartnerRideCard({
  booking,
  t,
  currencySymbol,
  isBookingPassed,
  setDetailBooking,
}: {
  booking: PartnerRideBooking;
  t: TFn;
  currencySymbol: string;
  isBookingPassed: PartnerRidesState["isBookingPassed"];
  setDetailBooking: PartnerRidesState["setDetailBooking"];
}) {
  return (
    <Card
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Car className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {t("trip")} #{booking.tripId.slice(0, 8)}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {booking.vehicleDetails.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <PartnerRideStatusBadge
                                booking={booking}
                                t={t}
                                isPassed={isBookingPassed(booking.date, booking.time)}
                              />
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  {t("your-payout")}
                                </p>
                                <p className="text-base font-semibold text-green-600">
                                  {currencySymbol}
                                  {(booking.partnerPayoutAmount ?? booking.totalAmount ?? 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Date & Time */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {booking.tripType === "roundtrip"
                                  ? t("departure")
                                  : t("date")}
                              </div>
                              <p className="text-sm font-medium">
                                {new Date(booking.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {t("time")}
                              </div>
                              <p className="text-sm font-medium">
                                {booking.time}
                              </p>
                            </div>
                            {booking.tripType === "roundtrip" &&
                              booking.returnDate && (
                                <>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      {t("return")}
                                    </div>
                                    <p className="text-sm font-medium">
                                      {new Date(
                                        booking.returnDate
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      {t("time")}
                                    </div>
                                    <p className="text-sm font-medium">
                                      {booking.returnTime}
                                    </p>
                                  </div>
                                </>
                              )}
                          </div>

                          {/* Route */}
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="font-medium">{t("route")}:</span>
                              {booking.stops && booking.stops.length > 0 ? (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="max-w-[8rem] truncate">
                                    {booking.pickup}
                                  </span>
                                  {booking.stops
                                    .sort((a, b) => a.order - b.order)
                                    .map((stop, index) => (
                                      <span key={index} className="flex items-center gap-1">
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                        <span className="max-w-[8rem] truncate">
                                          {stop.location}
                                        </span>
                                      </span>
                                    ))}
                                  {booking.dropoff && (
                                    <>
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                      <span className="max-w-[8rem] truncate">
                                        {booking.dropoff}
                                      </span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="max-w-[10rem] truncate">
                                    {booking.pickup}
                                  </span>
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="max-w-[10rem] truncate">
                                    {booking.dropoff}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Passenger Info */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {t("passenger")}:
                              </span>
                              <span className="font-medium">
                                {booking.firstName} {booking.lastName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{booking.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium truncate">
                                {booking.email}
                              </span>
                            </div>
                          </div>

                          {/* Additional Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {t("passengers")}:
                              </span>
                              <span className="font-medium">
                                {booking.passengers}
                              </span>
                            </div>
                            {booking.childSeats > 0 && (
                              <div className="flex items-center gap-2">
                                <Baby className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {t("child-seats")}:
                                </span>
                                <span className="font-medium">
                                  {booking.childSeats}
                                </span>
                              </div>
                            )}
                            {booking.babySeats > 0 && (
                              <div className="flex items-center gap-2">
                                <Baby className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {t("baby-seats")}:
                                </span>
                                <span className="font-medium">
                                  {booking.babySeats}
                                </span>
                              </div>
                            )}
                            {booking.flightNumber && (
                              <div className="flex items-center gap-2">
                                <Plane className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {t("flight")}:
                                </span>
                                <span className="font-medium">
                                  {booking.flightNumber}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {booking.notes && (
                            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
                              <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                                {t("special-requests")}:
                              </p>
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                {booking.notes}
                              </p>
                            </div>
                          )}

                          {/* View Details Button */}
                          <div className="pt-2 border-t">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setDetailBooking(booking)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {t("view-details")}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
  );
}
