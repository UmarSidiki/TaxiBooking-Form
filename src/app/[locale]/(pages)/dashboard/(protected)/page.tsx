"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/utils/api";

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
        const data = await apiGet<{ success: boolean; data: DashboardStats; message?: string }>("/api/dashboard/stats");

        if (data.success) {
          setStats(data.data);
        } else {
          setError(
            data.message || t("Dashboard.Home.failed-to-fetch-dashboard-stats")
          );
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(t('Dashboard.Home.failed-to-load-dashboard-data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center gap-4 border-b p-4">
          <h1 className="text-3xl font-semibold">{t('Dashboard.Home.dashboard')}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center gap-4 border-b p-4">
          <h1 className="text-3xl font-semibold">{t('Dashboard.Home.dashboard')}</h1>
        </div>
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                {t('Dashboard.Home.error-loading-dashboard')} </h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center gap-4 border-b p-4">
          <h1 className="text-3xl font-semibold">{t('Dashboard.Home.dashboard')}</h1>
        </div>
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('Dashboard.Home.no-data-available')} </h3>
              <p className="text-gray-600">
                {t('Dashboard.Home.no-bookings-or-revenue-data-found')} </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b p-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('Dashboard.Home.dashboard')}</h1>
          <p className="text-gray-600 mt-1">
            {t('Dashboard.Home.welcome-back')}
          </p>
        </div>
        <Badge variant="outline" className="hidden sm:flex">
          {t('Dashboard.Home.last-updated')} {new Date().toLocaleDateString()}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {/* Total Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('Dashboard.Home.total-bookings')} </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">{t('Dashboard.Home.all-time-bookings')}</p>
          </CardContent>
        </Card>

        {/* Completed Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Dashboard.Rides.Completed')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Dashboard.Home.successfully-completed-trips')} </p>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Dashboard.Rides.Upcoming')}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.upcomingBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Dashboard.Home.scheduled-for-future')} </p>
          </CardContent>
        </Card>

        {/* Canceled Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Dashboard.Rides.Canceled')}</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.canceledBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Dashboard.Home.canceled-by-customers')} </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Total Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('Dashboard.Home.total-revenue')} </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              €{stats.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {stats.monthlyChange >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 text-sm">
                    +{stats.monthlyChange}{t('Dashboard.Home.from-last-month')}
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 text-sm">
                    {stats.monthlyChange}{t('Dashboard.Home.from-last-month')}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('Dashboard.Home.monthly-bookings')} </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.monthlyBookings}</div>
            <div className="flex items-center gap-2 mt-2">
              {stats.monthlyBookingsChange >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 text-sm">
                    +{stats.monthlyBookingsChange}{t('Dashboard.Home.from-last-month')}
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 text-sm">
                    {stats.monthlyBookingsChange}{t('Dashboard.Home.from-last-month')}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{t('Dashboard.Home.quick-actions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/rides")}
          >
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium">{t('Dashboard.Home.view-all-bookings')}</h3>
              <p className="text-sm text-gray-600 mt-1">{t('Dashboard.Home.manage-all-rides')}</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/fleet")}
          >
            <CardContent className="p-6 text-center">
              <Car className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium">{t('Dashboard.Home.manage-fleet')}</h3>
              <p className="text-sm text-gray-600 mt-1">{t('Dashboard.Home.vehicle-management')}</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/partners")}
          >
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium">{t('Dashboard.Home.view-partners')}</h3>
              <p className="text-sm text-gray-600 mt-1">{t('Dashboard.Home.partner-management')}</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/settings")}
          >
            <CardContent className="p-6 text-center">
              <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium">{t('Dashboard.Home.settings')}</h3>
              <p className="text-sm text-gray-600 mt-1">{t('Dashboard.Home.configure-system')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
