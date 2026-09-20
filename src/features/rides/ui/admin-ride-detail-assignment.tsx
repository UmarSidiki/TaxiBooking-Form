"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { IBooking } from "@/features/booking/model";
import { User, UserCheck, Users } from "lucide-react";

export function AdminRideDetailAssignment({
  booking,
  isBookingPassed,
}: {
  booking: IBooking;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
}) {
  if (
    !(
      (isBookingPassed(booking.date, booking.time) ||
        booking.status === "canceled") &&
      (booking.assignedDriver || booking.assignedPartner)
    )
  ) {
    return null;
  }

  return (
                <Card className="border border-border shadow-sm bg-background">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <UserCheck className="w-5 h-5 text-primary" />
                      <span>Assignment Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {booking.assignedDriver && (
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              Assigned Driver
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {booking.assignedDriver.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.assignedDriver.email}
                          </p>
                        </div>
                      )}
                      {booking.assignedPartner && (
                        <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-secondary-foreground" />
                            <span className="text-sm font-medium text-secondary-foreground">
                              Assigned Partner
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {booking.assignedPartner.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.assignedPartner.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
  );
}
