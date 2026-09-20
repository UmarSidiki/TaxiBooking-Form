"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import type { PartnerAvailableRide } from "@/features/partners/ui/partner-dashboard.types";
import { RideMapLine } from "@/features/rides/ui/ride-map-line";
import { useLocale, type useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Dashboard">>;

export function PartnerDashboardAvailable({
  t,
  rides,
  currencySymbol,
  acceptingRide,
  onAccept,
}: {
  t: TFn;
  rides: PartnerAvailableRide[];
  currencySymbol: string;
  acceptingRide: string | null;
  onAccept: (rideId: string) => void;
}) {
  const locale = useLocale();
  if (rides.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold tracking-tight">{t("available-rides")}</h2>
        <Badge variant="secondary">
          {rides.length} {t("available")}
        </Badge>
      </div>
      <div className="grid gap-4">
        {rides.map((ride) => (
          <Card key={ride._id} className="desk-card border-border">
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold">#{ride.tripId.slice(0, 8)}</h3>
                  <p className="text-sm text-muted-foreground">{ride.vehicleDetails.name}</p>
                </div>
                <p className="text-lg font-semibold">
                  {currencySymbol}
                  {(ride.partnerPayoutAmount ?? ride.totalAmount).toFixed(2)}
                </p>
              </div>
              <RideMapLine start={ride.pickup} end={ride.dropoff || "—"} />
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">{t("date-time")}</span>
                  <span className="ms-2 font-medium">
                    {new Date(ride.date).toLocaleDateString(locale)} {ride.time}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t("passengers")}</span>
                  <span className="ms-2 font-medium">{ride.passengers}</span>
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">{t("customer")}</span>
                  <span className="ms-2 font-medium">
                    {ride.firstName} {ride.lastName}
                  </span>
                </p>
              </div>
              {ride.notes ? (
                <p className="text-sm text-muted-foreground">{ride.notes}</p>
              ) : null}
              <Button
                className="h-11 w-full sm:w-auto"
                disabled={acceptingRide === ride._id}
                onClick={() => onAccept(ride._id)}
              >
                {acceptingRide === ride._id ? t("accepting") : t("accept-ride")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
