"use client";

import { PartnerRideCard } from "@/features/partners/ui/partner-ride-card";
import { PartnerRideDetailDialog } from "@/features/partners/ui/partner-ride-detail-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { usePartnerRides } from "@/features/rides/hooks/usePartnerRides";
import { Car } from "lucide-react";

export default function PartnerRidesPage() {
  const rides = usePartnerRides();
  const {
    t,
    tRides,
    currencySymbol,
    loading,
    detailBooking,
    setDetailBooking,
    isBookingPassed,
    upcomingBookings,
  } = rides;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("rides")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("your-upcoming-scheduled-rides")}
        </p>
      </div>

      {/* Rides List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("upcoming-rides")} ({upcomingBookings.length})
          </CardTitle>
          <CardDescription>
            {t("view-and-manage-your-assigned-rides")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("no-upcoming-rides-found")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <PartnerRideCard
                  key={booking._id}
                  booking={booking}
                  t={t}
                  currencySymbol={currencySymbol}
                  isBookingPassed={isBookingPassed}
                  setDetailBooking={setDetailBooking}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PartnerRideDetailDialog
        t={t}
        tRides={tRides}
        currencySymbol={currencySymbol}
        detailBooking={detailBooking}
        setDetailBooking={setDetailBooking}
        isBookingPassed={isBookingPassed}
      />
    </div>
  );
}
