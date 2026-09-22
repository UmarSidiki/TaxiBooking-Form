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
  currency,
  locale,
}: {
  t: TFn;
  stats: DashboardStats;
  currency: string;
  locale: string;
}) {
  const bookings = stats.recentBookings ?? [];
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <Card className="desk-card gap-4 border-border py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-base font-semibold text-foreground">
          {t("Dashboard.Home.recent-bookings")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5">
        {bookings.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Dashboard.Home.no-recent-bookings")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {bookings.slice(0, DASHBOARD_PREVIEW_LIMIT).map((booking) => (
              <li
                key={booking.id}
                className="flex min-h-14 items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {booking.customer}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {date.format(new Date(booking.date))}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-sm font-medium tabular-nums text-foreground">
                    {money.format(booking.amount)}
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
