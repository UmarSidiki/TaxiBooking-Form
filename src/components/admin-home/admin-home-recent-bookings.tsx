"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/components/admin-home/admin-home.types";
import { DASHBOARD_PREVIEW_LIMIT } from "@/lib/dashboard/dashboard-preview-limit";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeRecentBookings({
  t,
  stats,
  currencySymbol,
}: {
  t: TFn;
  stats: DashboardStats;
  currencySymbol: string;
}) {
  return (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {t("Dashboard.Home.recent-bookings")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentBookings && stats.recentBookings.length > 0 ? (
                stats.recentBookings.slice(0, DASHBOARD_PREVIEW_LIMIT).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          booking.status === "completed"
                            ? "bg-green-500"
                            : booking.status === "upcoming"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        )}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.customer}
                        </p>
                        <p className="text-xs text-gray-500">{booking.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {currencySymbol}{booking.amount}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          booking.status === "completed"
                            ? "text-green-600 border-green-200 bg-green-50"
                            : booking.status === "upcoming"
                            ? "text-amber-600 border-amber-200 bg-amber-50"
                            : "text-red-600 border-red-200 bg-red-50"
                        )}
                      >
                        {booking.status === "completed"
                          ? t("Dashboard.Rides.Completed")
                          : booking.status === "upcoming"
                          ? t("Dashboard.Rides.Upcoming")
                          : t("Dashboard.Rides.Canceled")}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {t("Dashboard.Home.no-recent-bookings")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
  );
}
