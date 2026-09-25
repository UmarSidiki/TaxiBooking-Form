"use client";

import { AdminHomeHeader } from "@/features/dashboard/ui/admin-home-header";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeLoading({ t }: { t: TFn }) {
  return (
    <div className="flex flex-col gap-5" role="status" aria-live="polite">
      <span className="sr-only">{t("Dashboard.Home.dashboard")}…</span>
      <AdminHomeHeader t={t} />
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-11 w-36 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-border/60 bg-card"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border/60 bg-card" />
    </div>
  );
}
