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
    hint: (t: TFn) => t("Dashboard.Home.all-time-bookings"),
    value: (stats: DashboardStats) => stats.totalBookings,
  },
  {
    key: "completed" as const,
    icon: CheckCircle,
    label: (t: TFn) => t("Dashboard.Rides.Completed"),
    hint: (t: TFn) => t("Dashboard.Home.successfully-completed-trips"),
    value: (stats: DashboardStats) => stats.completedBookings,
  },
  {
    key: "upcoming" as const,
    icon: Clock,
    label: (t: TFn) => t("Dashboard.Rides.Upcoming"),
    hint: (t: TFn) => t("Dashboard.Home.scheduled-for-future"),
    value: (stats: DashboardStats) => stats.upcomingBookings,
  },
  {
    key: "canceled" as const,
    icon: XCircle,
    label: (t: TFn) => t("Dashboard.Rides.Canceled"),
    hint: (t: TFn) => t("Dashboard.Home.canceled-by-customers"),
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
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map((item) => (
        <Card key={item.key} className="desk-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <item.icon className="size-5 text-primary" aria-hidden="true" />
              <dt className="text-xs font-medium text-muted-foreground">
                {item.label(t)}
              </dt>
            </div>
            <dd className="mt-4 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
              {item.value(stats)}
            </dd>
            <p className="mt-1 text-sm text-muted-foreground">{item.hint(t)}</p>
          </CardContent>
        </Card>
      ))}
    </dl>
  );
}
