"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { AdminHomeHeader } from "@/features/dashboard/ui/admin-home-header";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeLoading({ t }: { t: TFn }) {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">{t("Dashboard.Home.dashboard")}…</span>
      <AdminHomeHeader t={t}>
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </AdminHomeHeader>
      <Card className="desk-card gap-4 border-border py-5">
        <CardContent className="space-y-4 px-5">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex min-h-12 items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="desk-card border-border">
            <CardContent className="space-y-3 p-5">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
