"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { DashboardStats } from "@/features/dashboard/ui/admin-home.types";
import { DASHBOARD_PREVIEW_LIMIT } from "@/features/dashboard/lib/dashboard-preview-limit";
import { MapPin } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeDestinations({
  t,
  stats,
}: {
  t: TFn;
  stats: DashboardStats;
}) {
  const destinations = stats.topDestinations ?? [];

  return (
    <Card className="desk-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          {t("Dashboard.Home.top-destinations")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {destinations.length === 0 ? (
          <div className="py-8 text-center">
            <MapPin className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Dashboard.Home.no-destination-data")}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {destinations.slice(0, DASHBOARD_PREVIEW_LIMIT).map((destination) => (
              <li
                key={destination.name}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {destination.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {destination.count} {t("Dashboard.Home.bookings")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${destination.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {destination.percentage}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
