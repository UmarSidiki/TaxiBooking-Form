"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { DashboardStats } from "@/features/dashboard/ui/admin-home.types";
import { cn } from "@/shared/lib/utils";
import { ArrowDownRight, ArrowUpRight, Calendar, DollarSign } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeRevenue({
  t,
  stats,
  currencySymbol,
}: {
  t: TFn;
  stats: DashboardStats;
  currencySymbol: string;
}) {
  return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Revenue */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              {t("Dashboard.Home.total-revenue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {currencySymbol}{stats.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center mt-3">
              <div
                className={cn(
                  "flex items-center text-sm font-medium",
                  stats.monthlyChange >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {stats.monthlyChange >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {Math.abs(stats.monthlyChange)}%
              </div>
              <span className="text-sm text-gray-500 ml-2">
                {t("Dashboard.Home.from-last-month")}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {t("Dashboard.Home.monthly-revenue")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {currencySymbol}{stats.monthlyRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Bookings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              {t("Dashboard.Home.monthly-bookings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.monthlyBookings}
            </div>
            <div className="flex items-center mt-3">
              <div
                className={cn(
                  "flex items-center text-sm font-medium",
                  stats.monthlyBookingsChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {stats.monthlyBookingsChange >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {Math.abs(stats.monthlyBookingsChange)}%
              </div>
              <span className="text-sm text-gray-500 ml-2">
                {t("Dashboard.Home.from-last-month")}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {t("Dashboard.Home.completion-rate")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalBookings > 0
                    ? Math.round(
                        (stats.completedBookings / stats.totalBookings) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
