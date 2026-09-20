"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { RidePaymentStatusBadge } from "@/features/rides/ui/ride-payment-status-badge";
import { RideStatusBadge } from "@/features/rides/ui/ride-status-badge";
import type { IBooking } from "@/features/booking/model";
import {
  Ban,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  Receipt,
  RefreshCw,
} from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideDetailBilling({
  booking,
  t,
  currencySymbol,
}: {
  booking: IBooking;
  t: TFn;
  currencySymbol: string;
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.TotalAmount")}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currencySymbol}
                        {booking.totalAmount?.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <CreditCard className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.PaymentMethod")}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {booking.paymentMethod?.replace("_", " ") ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <Clock className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.PaymentStatus")}
                      </p>
                      <div className="flex justify-center">
                        <RidePaymentStatusBadge status={booking.paymentStatus} />
                      </div>
                    </div>

                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <Calendar className="w-6 h-6 text-secondary-foreground mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        {t("Dashboard.Rides.TripStatus")}
                      </p>
                      <div className="flex justify-center">
                        <RideStatusBadge booking={booking} />
                      </div>
                    </div>
                  </div>

                  {/* Cancellation/Refund Info */}
                  {booking.status === "canceled" ||
                  booking.refundAmount ? (
                    <div className="mt-4 p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                      {booking.status === "canceled" &&
                        booking.canceledAt && (
                          <div className="flex items-center gap-2 text-gray-700 mb-2">
                            <Ban className="w-4 h-4" />
                            <span className="font-medium">
                              {t("Dashboard.Rides.CanceledOn")}{" "}
                              {new Date(
                                booking.canceledAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                      {booking.refundAmount &&
                        booking.refundAmount > 0 && (
                          <div className="flex items-center justify-between text-gray-700">
                            <span className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4" />
                              {t("Dashboard.Rides.RefundProcessed")}
                            </span>
                            <span className="font-bold">
                              {currencySymbol}
                              {booking.refundAmount.toFixed(2)}
                              {booking.refundPercentage && (
                                <span className="text-sm font-normal ml-1">
                                  ({booking.refundPercentage}%)
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
  );
}
