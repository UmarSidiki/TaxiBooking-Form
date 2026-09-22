"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { AdminHomeHeader } from "@/features/dashboard/ui/admin-home-header";
import { AlertCircle } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeError({ t, error }: { t: TFn; error: string }) {
  return (
    <div className="space-y-6">
      <AdminHomeHeader t={t} />
      <Card className="desk-card border-destructive/40">
        <CardContent className="flex gap-4 p-6">
          <AlertCircle className="size-6 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("Dashboard.Home.error-loading-dashboard")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground" role="alert">
              {error}
            </p>
            <Button
              variant="outline"
              className="mt-4 h-11"
              onClick={() => window.location.reload()}
            >
              {t("Dashboard.Home.try-again")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminHomeEmpty({ t }: { t: TFn }) {
  return (
    <div className="space-y-6">
      <AdminHomeHeader t={t} />
      <Card className="desk-card border-border">
        <CardContent className="p-6" role="status">
          <h3 className="text-lg font-semibold text-foreground">
            {t("Dashboard.Home.no-data-available")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Dashboard.Home.no-bookings-or-revenue-data-found")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
