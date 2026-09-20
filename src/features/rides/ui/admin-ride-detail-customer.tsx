"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IBooking } from "@/models/booking";
import { Car, Mail, PhoneCall, Plane, User, UserCheck } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideDetailCustomer({
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
                      <UserCheck className="w-5 h-5 text-primary" />
                      {t("Dashboard.Rides.CustomerInformation")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                      <User className="w-5 h-5 text-secondary-foreground" />
                      <p className="font-semibold text-gray-900 text-lg">
                        {booking.firstName} {booking.lastName}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm p-3 bg-secondary/10 rounded-lg">
                        <Mail className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                        <a
                          href={`mailto:${booking.email}`}
                          className="text-primary hover:underline break-all"
                        >
                          {booking.email}
                        </a>
                      </div>

                      <div className="flex items-center gap-3 text-sm p-3 bg-secondary/10 rounded-lg">
                        <PhoneCall className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                        <a
                          href={`tel:${booking.phone}`}
                          className="text-primary hover:underline"
                        >
                          {booking.phone}
                        </a>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Car className="w-4 h-4 text-secondary-foreground" />
                        {t("Dashboard.Rides.Vehicle")}
                      </p>
                      <p className="text-gray-600 p-2 bg-secondary/10 rounded-lg">
                        {booking.vehicleDetails?.name ||
                          booking.selectedVehicle}
                      </p>
                      {booking.flightNumber && (
                        <div className="mt-3">
                          <p className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Plane className="w-4 h-4 text-secondary-foreground" />
                            {t("Dashboard.Rides.flight-number2")}{" "}
                          </p>
                          <p className="text-gray-600 p-2 bg-secondary/10 rounded-lg">
                            {booking.flightNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
  );
}
