"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/components/admin-home/admin-home.types";
import { DASHBOARD_PREVIEW_LIMIT } from "@/lib/dashboard/dashboard-preview-limit";
import { MapPin } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeDestinations({
  t,
  stats,
}: {
  t: TFn;
  stats: DashboardStats;
}) {
  return (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-red-600" />
                {t("Dashboard.Home.top-destinations")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topDestinations && stats.topDestinations.length > 0 ? (
                stats.topDestinations.slice(0, DASHBOARD_PREVIEW_LIMIT).map((destination, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {destination.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {destination.count} {t("Dashboard.Home.bookings")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${destination.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {destination.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {t("Dashboard.Home.no-destination-data")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
  );
}
