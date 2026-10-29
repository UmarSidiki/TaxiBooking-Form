"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import type { Ride } from "./account-types";

export function TripCard({ ride, t, onView }: { ride: Ride; t: (k: string) => string; onView: () => void }) {
  const status = ride.status ?? "upcoming";
  return (
    <Card className="mt-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium">{ride.pickup} → {ride.dropoff || t("hourly")}</p>
          <span className="text-xs text-muted-foreground">{t(`status-${status}`) || status}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{ride.date} {ride.time}</p>
        {typeof ride.totalAmount === "number" ? (
          <p className="mt-1 text-sm">{t("total")}: {ride.totalAmount.toFixed(2)}</p>
        ) : null}
        <div className="mt-3">
          <Button className="h-11" type="button" variant="outline" onClick={onView}>{t("details")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}