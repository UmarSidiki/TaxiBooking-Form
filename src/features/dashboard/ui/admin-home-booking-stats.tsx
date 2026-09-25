"use client";

import { Card, CardContent } from "@/shared/ui/card";
import type { DashboardStats } from "@/features/dashboard/ui/admin-home.types";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

const STATS = [
  {
    key: "total" as const,
    icon: Calendar,
    label: (t: TFn) => t("Dashboard.Home.total-bookings"),
    value: (stats: DashboardStats) => stats.totalBookings,
  },
  {
    key: "completed" as const,
    icon: CheckCircle,
    label: (t: TFn) => t("Dashboard.Rides.Completed"),
    value: (stats: DashboardStats) => stats.completedBookings,
  },
  {
    key: "upcoming" as const,
    icon: Clock,
    label: (t: TFn) => t("Dashboard.Rides.Upcoming"),
    value: (stats: DashboardStats) => stats.upcomingBookings,
  },
  {
    key: "canceled" as const,
    icon: XCircle,
    label: (t: TFn) => t("Dashboard.Rides.Canceled"),
    value: (stats: DashboardStats) => stats.canceledBookings,
  },
];

export function AdminHomeBookingStats({
  t,
  stats,
}: {
  t: TFn;
  stats: DashboardStats;
}) {
  return (
    <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {STATS.map((item) => (
        <Card key={item.key} className="desk-card border-border/60">
          <CardContent className="flex items-center justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <dt className="truncate text-xs font-medium text-muted-foreground">
                {item.label(t)}
              </dt>
              <dd className="text-xl font-semibold tabular-nums text-foreground">
                {item.value(stats)}
              </dd>
            </div>
            <item.icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          </CardContent>
        </Card>
      ))}
    </dl>
  );
}
