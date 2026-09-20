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

export function DriverRideDetailPayment({
  t,
  currencySymbol,
  detailBooking,
  isBookingPassed,
}: {
  t: TFn;
  currencySymbol: string;
  detailBooking: Booking;
  isBookingPassed: DriverDashboardState["isBookingPassed"];
}) {
  return (
              <Card className="border border-border shadow-sm bg-background">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Receipt className="w-5 h-5 text-primary" />
                    {t("Dashboard.Rides.BillingAndPayment")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.TotalAmount")}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currencySymbol}{detailBooking.totalAmount?.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <CreditCard className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.PaymentMethod")}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {detailBooking.paymentMethod?.replace("_", " ") ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <Clock className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.PaymentStatus")}
                      </p>
                      <div className="flex justify-center">
                        <RidePaymentStatusBadge status={detailBooking.paymentStatus} />
                      </div>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <Calendar className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.TripStatus")}
                      </p>
                      <div className="flex justify-center">
                        <RideStatusBadge
                          booking={detailBooking}
                          isCompleted={isBookingPassed(detailBooking.date, detailBooking.time)}
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
                              {t("Dashboard.Rides.CanceledOn")}{" "}
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
                              {t("Dashboard.Rides.RefundProcessed")}
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
  );
}
