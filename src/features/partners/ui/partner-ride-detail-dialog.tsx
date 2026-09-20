"use client";

import {
  PartnerRidePaymentBadge,
  PartnerRideStatusBadge,
} from "@/features/partners/ui/partner-ride-badges";
import type { usePartnerRides } from "@/features/rides/hooks/usePartnerRides";
import { formatStopWaitDuration } from "@/features/rides/lib/format-stop-wait-duration";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Baby,
  Ban,
  Calendar,
  CalendarDays,
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

type PartnerRidesState = ReturnType<typeof usePartnerRides>;

export function PartnerRideDetailDialog({
  t,
  tRides,
  currencySymbol,
  detailBooking,
  setDetailBooking,
  isBookingPassed,
}: Pick<
  PartnerRidesState,
  | "t"
  | "tRides"
  | "currencySymbol"
  | "detailBooking"
  | "setDetailBooking"
  | "isBookingPassed"
>) {
  return (
    <>
      {/* Detail Dialog */}
      <Dialog
        open={Boolean(detailBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailBooking(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailBooking && (
            <div className="space-y-6">
              <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    detailBooking.status === "canceled" ? "bg-destructive/10" : 
                    isBookingPassed(detailBooking.date, detailBooking.time) ? "bg-muted/10" : "bg-primary/10"
                  }`}>
                    <Car className={`w-6 h-6 ${
                      detailBooking.status === "canceled" ? "text-destructive" : 
                      isBookingPassed(detailBooking.date, detailBooking.time) ? "text-muted-foreground" : "text-primary"
                    }`} />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      {tRides("Trip")} #
                      {detailBooking.tripId.slice(0, 8)}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 mt-1">
                      {detailBooking.tripType === 'roundtrip' ? (
                        <>
                          {tRides("departure")}: {new Date(detailBooking.date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )} at {detailBooking.time}
                          {detailBooking.returnDate && (
                            <>
                              <br />
                              {tRides("return")}: {new Date(detailBooking.returnDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )} at {detailBooking.returnTime}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {tRides("ScheduledFor")}{" "}
                          {new Date(detailBooking.date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}{" "}
                          at {detailBooking.time}
                        </>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Journey Details */}
                <Card className="border border-border shadow-sm bg-background">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <Route className="w-5 h-5 text-primary" />
                      {tRides("JourneyDetails")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-secondary-foreground" />
                        <span className="font-medium text-gray-700">
                          {tRides("PickupLocation")}
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
                            {tRides("Stops")}
                          </span>
                        </div>
                        <div className="ml-6 space-y-2">
                          {detailBooking.stops
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
                          {tRides("DropoffLocation")}
                        </span>
                      </div>
                      <p className="text-gray-600 ml-6 p-2 bg-secondary/10 rounded-lg">
                        {detailBooking.dropoff ||
                          tRides("NotSpecified")}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {detailBooking.tripType === 'roundtrip' ? tRides("DepartureDate") : tRides("Date")}
                          </p>
                          <p className="text-gray-600">{detailBooking.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {detailBooking.tripType === 'roundtrip' ? tRides("DepartureTime") : tRides("Time")}
                          </p>
                          <p className="text-gray-600">{detailBooking.time}</p>
                        </div>
                      </div>
                    </div>

                    {detailBooking.tripType === 'roundtrip' && detailBooking.returnDate && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="w-4 h-4 text-secondary-foreground" />
                          <div>
                            <p className="font-medium text-gray-700">
                              {tRides("ReturnDate")}
                            </p>
                            <p className="text-gray-600">{detailBooking.returnDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-secondary-foreground" />
                          <div>
                            <p className="font-medium text-gray-700">
                              {tRides("ReturnTime")}
                            </p>
                            <p className="text-gray-600">{detailBooking.returnTime}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-secondary-foreground" />
                        <div>
                          <p className="font-medium text-gray-700">
                            {tRides("Passengers")}
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
                            `${detailBooking.childSeats} Child Seat${detailBooking.childSeats > 1 ? 's' : ''}`}
                          {detailBooking.childSeats > 0 &&
                            detailBooking.babySeats > 0 &&
                            " • "}
                          {detailBooking.babySeats > 0 &&
                            `${detailBooking.babySeats} Baby Seat${detailBooking.babySeats > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card className="border border-border shadow-sm bg-background">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <UserCheck className="w-5 h-5 text-primary" />
                      {tRides("CustomerInformation")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                      <User className="w-5 h-5 text-secondary-foreground" />
                      <p className="font-semibold text-gray-900 text-lg">
                        {detailBooking.firstName} {detailBooking.lastName}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm p-3 bg-secondary/10 rounded-lg">
                        <Mail className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                        <a
                          href={`mailto:${detailBooking.email}`}
                          className="text-primary hover:underline break-all"
                        >
                          {detailBooking.email}
                        </a>
                      </div>

                      <div className="flex items-center gap-3 text-sm p-3 bg-secondary/10 rounded-lg">
                        <PhoneCall className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                        <a
                          href={`tel:${detailBooking.phone}`}
                          className="text-primary hover:underline"
                        >
                          {detailBooking.phone}
                        </a>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Car className="w-4 h-4 text-secondary-foreground" />
                        {tRides("Vehicle")}
                      </p>
                      <p className="text-gray-600 p-2 bg-secondary/10 rounded-lg">
                        {detailBooking.vehicleDetails?.name}
                      </p>
                      {detailBooking.flightNumber && (
                        <div className="mt-3">
                          <p className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Plane className="w-4 h-4 text-secondary-foreground" />
                            {tRides('flight-number2')}
                          </p>
                          <p className="text-gray-600 p-2 bg-secondary/10 rounded-lg">
                            {detailBooking.flightNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Special Notes */}
              {detailBooking.notes && (
                <Card className="border border-border bg-secondary/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          {tRides("SpecialNotes")}
                        </p>
                        <p className="text-gray-700">{detailBooking.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Billing Information */}
              <Card className="border border-border shadow-sm bg-background">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Receipt className="w-5 h-5 text-primary" />
                    {tRides("BillingAndPayment")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {tRides("TotalAmount")}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currencySymbol}{detailBooking.totalAmount?.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <CreditCard className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {tRides("PaymentMethod")}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {detailBooking.paymentMethod?.replace("_", " ") ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <Clock className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {tRides("PaymentStatus")}
                      </p>
                      <div className="flex justify-center">
                        <PartnerRidePaymentBadge
                          status={detailBooking.paymentStatus}
                          tRides={tRides}
                        />
                      </div>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <Calendar className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {tRides("TripStatus")}
                      </p>
                      <div className="flex justify-center">
                        <PartnerRideStatusBadge
                          booking={detailBooking}
                          t={t}
                          isPassed={isBookingPassed(detailBooking.date, detailBooking.time)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cancellation/Refund Info */}
                  {(detailBooking.status === "canceled" ||
                    detailBooking.refundAmount) && (
                    <div className="mt-4 p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                      {detailBooking.status === "canceled" &&
                        detailBooking.canceledAt && (
                          <div className="flex items-center gap-2 text-gray-700 mb-2">
                            <Ban className="w-4 h-4" />
                            <span className="font-medium">
                              {tRides("CanceledOn")}{" "}
                              {new Date(
                                detailBooking.canceledAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                      {detailBooking.refundAmount &&
                        detailBooking.refundAmount > 0 && (
                          <div className="flex items-center justify-between text-gray-700">
                            <span className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4" />
                              {tRides("RefundProcessed")}
                            </span>
                            <span className="font-bold">
                              {currencySymbol}{detailBooking.refundAmount.toFixed(2)}
                              {detailBooking.refundPercentage && (
                                <span className="text-sm font-normal ml-1">
                                  ({detailBooking.refundPercentage}%)
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
