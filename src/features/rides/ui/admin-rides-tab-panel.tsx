"use client";

import { Button } from "@/shared/ui/button";
import { TabsContent } from "@/shared/ui/tabs";
import { RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function AdminRidesTabPanel({
  value,
  isLoading,
  isEmpty,
  fetchBookings,
  t,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  children,
  gridClassName = "flex flex-col gap-3",
}: {
  value: string;
  isLoading: boolean;
  isEmpty: boolean;
  fetchBookings: () => void;
  t: ReturnType<typeof useTranslations>;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
  gridClassName?: string;
}) {
  return (
    <TabsContent value={value} className="mt-0 outline-none">
      {isLoading ? (
        <div className="flex flex-col gap-3" role="status">
          <span className="sr-only">{t("Dashboard.Rides.LoadingRides")}</span>
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-border/60 bg-card"
            />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <EmptyIcon
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {emptyTitle}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {emptyDescription}
            </p>
          </div>
          <Button
            onClick={fetchBookings}
            variant="outline"
            className="mt-1 h-10 rounded-xl"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {t("Dashboard.Rides.Refresh")}
          </Button>
        </div>
      ) : (
        <div className={gridClassName}>{children}</div>
      )}
    </TabsContent>
  );
}
