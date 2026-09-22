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
  currency,
  locale,
}: {
  t: TFn;
  stats: DashboardStats;
  currency: string;
  locale: string;
}) {
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="desk-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">
            {t("Dashboard.Home.total-revenue")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {money.format(stats.totalRevenue)}
          </p>
          <ChangeRow
            value={stats.monthlyChange}
            label={t("Dashboard.Home.from-last-month")}
          />
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">
              {t("Dashboard.Home.monthly-revenue")}
            </span>
            <span className="text-sm font-medium tabular-nums text-foreground">
              {money.format(stats.monthlyRevenue)}
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
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
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
            <span className="text-sm font-medium tabular-nums text-foreground">
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
          <ArrowUpRight className="me-1 size-4" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="me-1 size-4" aria-hidden="true" />
        )}
        {Math.abs(value)}%
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
