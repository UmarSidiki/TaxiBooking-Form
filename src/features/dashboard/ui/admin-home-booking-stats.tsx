"use client";

import { Card, CardContent } from "@/shared/ui/card";
import type { DashboardStats } from "@/features/dashboard/ui/admin-home.types";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeBookingStats({
  t,
  stats,
}: {
  t: TFn;
  stats: DashboardStats;
}) {
  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bookings */}
        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("Dashboard.Home.total-bookings")}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalBookings}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t("Dashboard.Home.all-time-bookings")}
            </p>
          </CardContent>
        </Card>

        {/* Completed Bookings */}
        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("Dashboard.Rides.Completed")}
              </span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {stats.completedBookings}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t("Dashboard.Home.successfully-completed-trips")}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("Dashboard.Rides.Upcoming")}
              </span>
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {stats.upcomingBookings}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t("Dashboard.Home.scheduled-for-future")}
            </p>
          </CardContent>
        </Card>

        {/* Canceled Bookings */}
        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("Dashboard.Rides.Canceled")}
              </span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {stats.canceledBookings}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t("Dashboard.Home.canceled-by-customers")}
            </p>
          </CardContent>
        </Card>
      </div>
  );
}
