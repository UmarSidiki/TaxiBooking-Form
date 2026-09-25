"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { CheckCircle2, Clock, Users, XCircle } from "lucide-react";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

export function AdminPartnerStats({
  t,
  stats,
}: Pick<AdminPartnersState, "t" | "stats">) {
  const items = [
    { label: t("total-partners"), value: stats.total, icon: Users },
    { label: t("pending"), value: stats.pending, icon: Clock },
    { label: t("approved"), value: stats.approved, icon: CheckCircle2 },
    { label: t("rejected"), value: stats.rejected, icon: XCircle },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="desk-card border-border/60">
          <CardContent className="flex items-center justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <dt className="truncate text-xs font-medium text-muted-foreground">
                {item.label}
              </dt>
              <dd className="text-xl font-semibold tabular-nums text-foreground">
                {item.value}
              </dd>
            </div>
            <item.icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          </CardContent>
        </Card>
      ))}
    </dl>
  );
}
