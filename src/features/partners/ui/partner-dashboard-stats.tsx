"use client";

import { Card, CardContent } from "@/shared/ui/card";
import type { PartnerRideStats } from "@/features/partners/ui/partner-dashboard.types";
import { CheckCircle2, Clock, FileText, Wallet } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Dashboard">>;

export function PartnerDashboardStats({
  t,
  stats,
  currencySymbol,
}: {
  t: TFn;
  stats: PartnerRideStats;
  currencySymbol: string;
}) {
  const items = [
    {
      key: "total",
      label: t("total-rides"),
      value: String(stats.totalRides),
      icon: FileText,
    },
    {
      key: "upcoming",
      label: t("upcoming"),
      value: String(stats.upcomingRides),
      icon: Clock,
    },
    {
      key: "completed",
      label: t("completed"),
      value: String(stats.completedRides),
      icon: CheckCircle2,
    },
    {
      key: "earnings",
      label: t("total-earnings"),
      value: `${currencySymbol}${stats.totalEarnings.toFixed(2)}`,
      icon: Wallet,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.key} className="desk-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <item.icon className="size-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
