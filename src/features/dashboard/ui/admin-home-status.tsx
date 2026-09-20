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

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {t("Dashboard.Home.error-loading-dashboard")}
                </h3>
                <p className="text-red-700 mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  {t("Dashboard.Home.try-again")}
                </Button>
              </div>
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

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-12 w-12 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  {t("Dashboard.Home.no-data-available")}
                </h3>
                <p className="text-yellow-700">
                  {t("Dashboard.Home.no-bookings-or-revenue-data-found")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
