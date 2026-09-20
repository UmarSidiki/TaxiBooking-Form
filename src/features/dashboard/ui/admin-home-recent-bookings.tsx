"use client";

import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { DashboardStats } from "@/features/dashboard/ui/admin-home.types";
import { DASHBOARD_PREVIEW_LIMIT } from "@/features/dashboard/lib/dashboard-preview-limit";
import { Calendar } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeRecentBookings({
  t,
  stats,
  currencySymbol,
}: {
  t: TFn;
  stats: DashboardStats;
  currencySymbol: string;
}) {
  const bookings = stats.recentBookings ?? [];

  return (
    <Card className="desk-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          {t("Dashboard.Home.recent-bookings")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Dashboard.Home.no-recent-bookings")}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {bookings.slice(0, DASHBOARD_PREVIEW_LIMIT).map((booking) => (
              <li
                key={booking.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {booking.customer}
                  </p>
                  <p className="text-xs text-muted-foreground">{booking.date}</p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-medium text-foreground">
                    {currencySymbol}
                    {booking.amount}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {booking.status === "completed"
                      ? t("Dashboard.Rides.Completed")
                      : booking.status === "upcoming"
                        ? t("Dashboard.Rides.Upcoming")
                        : t("Dashboard.Rides.Canceled")}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
