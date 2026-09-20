"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { TabsContent } from "@/shared/ui/tabs";
import { Loader2, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function AdminRidesTabPanel({
  value,
  isLoading,
  isEmpty,
  fetchBookings,
  t,
  loadingWrapClass,
  loadingIconClass,
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
  loadingWrapClass: string;
  loadingIconClass: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
  gridClassName?: string;
}) {
  return (
    <TabsContent value={value} className="mt-6">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className={`w-16 h-16 ${loadingWrapClass} rounded-full flex items-center justify-center mb-4`}
          >
            <Loader2 className={`w-8 h-8 animate-spin ${loadingIconClass}`} />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {t("Dashboard.Rides.LoadingRides")}
          </h3>
          <p className="text-muted-foreground">
            {t("Dashboard.Rides.LoadingRidesDescription")}
          </p>
        </div>
      ) : isEmpty ? (
        <Card className="border-2 border-dashed border-border bg-background">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <EmptyIcon className="w-10 h-10 text-secondary-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {emptyTitle}
            </h3>
            <p className="mx-auto mb-6 max-w-md text-muted-foreground">
              {emptyDescription}
            </p>
            <Button
              onClick={fetchBookings}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
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
