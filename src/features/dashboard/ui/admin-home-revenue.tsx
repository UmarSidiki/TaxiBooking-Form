"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { DashboardStats } from "@/features/dashboard/ui/admin-home.types";
import { cn } from "@/shared/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeRevenue({
  t,
  stats,
  currencySymbol,
}: {
  t: TFn;
  stats: DashboardStats;
  currencySymbol: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="desk-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">
            {t("Dashboard.Home.total-revenue")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {currencySymbol}
            {stats.totalRevenue.toLocaleString()}
          </p>
          <ChangeRow
            value={stats.monthlyChange}
            label={t("Dashboard.Home.from-last-month")}
          />
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">
              {t("Dashboard.Home.monthly-revenue")}
            </span>
            <span className="text-sm font-medium text-foreground">
              {currencySymbol}
              {stats.monthlyRevenue.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className="desk-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">
            {t("Dashboard.Home.monthly-bookings")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {stats.monthlyBookings}
          </p>
          <ChangeRow
            value={stats.monthlyBookingsChange}
            label={t("Dashboard.Home.from-last-month")}
          />
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">
              {t("Dashboard.Home.completion-rate")}
            </span>
            <span className="text-sm font-medium text-foreground">
              {stats.totalBookings > 0
                ? Math.round(
                    (stats.completedBookings / stats.totalBookings) * 100
                  )
                : 0}
              %
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChangeRow({ value, label }: { value: number; label: string }) {
  const up = value >= 0;
  return (
    <div className="mt-3 flex items-center gap-2 text-sm">
      <span
        className={cn(
          "inline-flex items-center font-medium",
          up ? "text-foreground" : "text-destructive"
        )}
      >
        {up ? (
          <ArrowUpRight className="me-1 size-4" />
        ) : (
          <ArrowDownRight className="me-1 size-4" />
        )}
        {Math.abs(value)}%
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
