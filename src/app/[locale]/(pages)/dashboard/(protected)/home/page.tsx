"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/utils/api";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalBookings: number;
  completedBookings: number;
  upcomingBookings: number;
  canceledBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyChange: number;
  monthlyBookings: number;
  monthlyBookingsChange: number;
  recentBookings?: Array<{
    id: string;
    customer: string;
    date: string;
    status: "completed" | "upcoming" | "canceled";
    amount: number;
  }>;
  topDestinations?: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const t = useTranslations();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const data = await apiGet<{
          success: boolean;
          data: DashboardStats;
          message?: string;
        }>("/api/dashboard/stats");

        if (data.success) {
          setStats(data.data);
        } else {
          setError(
            data.message || t("Dashboard.Home.failed-to-fetch-dashboard-stats")
          );
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(t("Dashboard.Home.failed-to-load-dashboard-data"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [t]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("Dashboard.Home.dashboard")}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("Dashboard.Home.welcome-back")}
            </p>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="h-10 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("Dashboard.Home.dashboard")}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("Dashboard.Home.welcome-back")}
            </p>
          </div>
        </div>

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

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("Dashboard.Home.dashboard")}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("Dashboard.Home.welcome-back")}
            </p>
          </div>
        </div>

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("Dashboard.Home.dashboard")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t("Dashboard.Home.welcome-back")}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="hidden sm:flex bg-white">
            {t("Dashboard.Home.last-updated")} {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
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

      {/* Revenue and Monthly Bookings Section */}
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
              €{stats.totalRevenue.toLocaleString()}
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
                  €{stats.monthlyRevenue.toLocaleString()}
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

      {/* Recent Bookings and Top Destinations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
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
                stats.recentBookings.slice(0, 5).map((booking) => (
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
                        €{booking.amount}
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

        {/* Top Destinations */}
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
                stats.topDestinations.slice(0, 5).map((destination, index) => (
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
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("Dashboard.Home.quick-actions")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/rides")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                {t("Dashboard.Home.view-all-bookings")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("Dashboard.Home.manage-all-rides")}
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/fleet")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Car className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                {t("Dashboard.Home.manage-fleet")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("Dashboard.Home.vehicle-management")}
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/partners")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                {t("Dashboard.Home.view-partners")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("Dashboard.Home.partner-management")}
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => router.push("/dashboard/settings")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                {t("Dashboard.Home.settings")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("Dashboard.Home.configure-system")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}