"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
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
  gridClassName = "grid grid-cols-1 lg:grid-cols-2 gap-4",
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
  loadingWrapClass?: string;
  loadingIconClass?: string;
}) {
  return (
    <TabsContent value={value} className="mt-6">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" role="status">
          <span className="sr-only">{t("Dashboard.Rides.LoadingRides")}</span>
          {[0, 1, 2, 3].map((item) => (
            <Card key={item} className="desk-card gap-4 border-border p-5">
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-20 animate-pulse rounded-md bg-muted" />
            </Card>
          ))}
        </div>
      ) : isEmpty ? (
        <Card className="desk-card border-border bg-card">
          <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
              <EmptyIcon className="size-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {emptyTitle}
            </h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
              {emptyDescription}
            </p>
            <Button
              onClick={fetchBookings}
              variant="outline"
              className="min-h-11"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              {t("Dashboard.Rides.Refresh")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={gridClassName}>{children}</div>
      )}
    </TabsContent>
  );
}
