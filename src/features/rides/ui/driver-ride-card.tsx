"use client";

import React from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
  Baby,
  Calendar,
  CalendarDays,
  Car,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  Info,
  Mail,
  MapPin,
  PhoneCall,
  Plane,
  Route,
  User,
  Users,
} from "lucide-react";
import type { IBooking } from "@/features/booking/model";
import { RideMapLine } from "@/features/rides/ui/ride-map-line";
import { RidePaymentStatusBadge } from "@/features/rides/ui/ride-payment-status-badge";
import { RideStatusBadge } from "@/features/rides/ui/ride-status-badge";
import type { useTranslations } from "next-intl";

export function DriverRideCard({
  booking,
  t,
  currencySymbol,
  isBookingPassed,
  setDetailBooking,
}: {
  booking: IBooking;
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
  setDetailBooking: (booking: IBooking) => void;
}) {
    const getStatusColor = () => {
      if (booking.status === "canceled") return "destructive";
      if (new Date(booking.date) < new Date()) return "muted";
      return "primary";
    };

    const statusColor = getStatusColor();

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm bg-white overflow-hidden">
        {/* Top border indicator */}
        <div
          className={`h-1 ${
            statusColor === "destructive"
              ? "bg-destructive"
              : statusColor === "muted"
              ? "bg-muted"
              : "bg-primary"
          }`}
        ></div>

        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    statusColor === "destructive"
                      ? "bg-destructive/10"
                      : statusColor === "muted"
                      ? "bg-muted/10"
                      : "bg-primary/10"
                  }`}
                >
                  <Car
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      statusColor === "destructive"
                        ? "text-destructive"
                        : statusColor === "muted"
                        ? "text-muted-foreground"
                        : "text-primary"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                    {t("Dashboard.Rides.Trip")} #{booking.tripId.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {booking.vehicleDetails?.name || booking.selectedVehicle}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row self-start sm:self-auto">
                <RideStatusBadge
                  booking={booking}
                  isCompleted={isBookingPassed(booking.date, booking.time)}
                />
              </div>
            </div>

            {/* Trip Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                  <CalendarDays className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{t("Dashboard.Rides.Date")}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {new Date(booking.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{t("Dashboard.Rides.Time")}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {booking.time}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                  <Users className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {t("Dashboard.Rides.Passengers")}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {booking.passengers}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                  <DollarSign className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{t("Dashboard.Rides.Price")}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currencySymbol}{booking.totalAmount?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Additional Details */}
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
                      {t("Drivers.child-seats")}
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
                      {t("Drivers.baby-seats")}
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
                      {t("Drivers.flight-number")}
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
                        {t("Drivers.special-requests")}{" "}
                      </span>
                      <p className="text-xs text-secondary-foreground mt-1">
                        {booking.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Route Information */}
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
                        <React.Fragment key={index}>
                          <ChevronRight className="h-3 w-3 text-secondary-foreground/50" />
                          <span
                            className="max-w-[6rem] truncate"
                            title={stop.location}
                          >
                            {stop.location}
                          </span>
                        </React.Fragment>
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

            {/* Customer Information */}
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                <span className="text-gray-700 truncate">
                  {booking.firstName} {booking.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                <span className="text-gray-700 truncate">{booking.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                <span className="text-gray-700 truncate">{booking.phone}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailBooking(booking)}
                className="flex items-center justify-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-sm"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                {t("Dashboard.Rides.ViewDetails")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
