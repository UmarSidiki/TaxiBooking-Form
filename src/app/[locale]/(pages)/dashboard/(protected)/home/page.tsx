"use client";

import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAdminHome } from "@/hooks/dashboard/useAdminHome";
import { AdminHomeHeader } from "@/components/admin-home/admin-home-header";
import { AdminHomeLoading } from "@/components/admin-home/admin-home-loading";
import {
  AdminHomeEmpty,
  AdminHomeError,
} from "@/components/admin-home/admin-home-status";
import { AdminHomeBookingStats } from "@/components/admin-home/admin-home-booking-stats";
import { AdminHomeRevenue } from "@/components/admin-home/admin-home-revenue";
import { AdminHomeRecentBookings } from "@/components/admin-home/admin-home-recent-bookings";
import { AdminHomeDestinations } from "@/components/admin-home/admin-home-destinations";
import { AdminHomeQuickActions } from "@/components/admin-home/admin-home-quick-actions";

export default function DashboardPage() {
  const { currencySymbol } = useCurrency();
  const { stats, isLoading, error, t } = useAdminHome();

  if (isLoading) {
    return <AdminHomeLoading t={t} />;
  }

  if (error) {
    return <AdminHomeError t={t} error={error} />;
  }

  if (!stats) {
    return <AdminHomeEmpty t={t} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHomeHeader t={t}>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="hidden sm:flex bg-white">
            {t("Dashboard.Home.last-updated")} {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </AdminHomeHeader>

      {/* Stats Grid */}
      <AdminHomeBookingStats t={t} stats={stats} />

      {/* Revenue and Monthly Bookings Section */}
      <AdminHomeRevenue
        t={t}
        stats={stats}
        currencySymbol={currencySymbol}
      />

      {/* Recent Bookings and Top Destinations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <AdminHomeRecentBookings
          t={t}
          stats={stats}
          currencySymbol={currencySymbol}
        />

        {/* Top Destinations */}
        <AdminHomeDestinations t={t} stats={stats} />
      </div>

      {/* Quick Actions */}
      <AdminHomeQuickActions t={t} />
    </div>
  );
}
