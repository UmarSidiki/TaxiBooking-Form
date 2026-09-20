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

export function DriverRideDetailPassenger({
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
                      <UserCheck className="w-5 h-5 text-primary" />
                      {t("Dashboard.Rides.CustomerInformation")}
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
                        {t("Dashboard.Rides.Vehicle")}
                      </p>
                      <p className="text-gray-600 p-2 bg-secondary/10 rounded-lg">
                        {detailBooking.vehicleDetails?.name ||
                          detailBooking.selectedVehicle}
                      </p>
                      {detailBooking.flightNumber && (
                        <div className="mt-3">
                          <p className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Plane className="w-4 h-4 text-secondary-foreground" />
                            {t("Drivers.flight-number")}{" "}
                          </p>
                          <p className="text-gray-600 p-2 bg-secondary/10 rounded-lg">
                            {detailBooking.flightNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
  );
}
