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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="desk-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-2xl font-semibold text-foreground">{item.value}</p>
              </div>
              <item.icon className="size-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
