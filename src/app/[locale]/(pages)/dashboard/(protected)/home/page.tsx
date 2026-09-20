"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { useLocale } from "next-intl";
import { useCurrency } from "@/shared/context/currency-context";
import { useAdminHome } from "@/features/dashboard/hooks/useAdminHome";
import { AdminHomeHeader } from "@/features/dashboard/ui/admin-home-header";
import { AdminHomeLoading } from "@/features/dashboard/ui/admin-home-loading";
import {
  AdminHomeEmpty,
  AdminHomeError,
} from "@/features/dashboard/ui/admin-home-status";
import { AdminHomeBookingStats } from "@/features/dashboard/ui/admin-home-booking-stats";
import { AdminHomeRevenue } from "@/features/dashboard/ui/admin-home-revenue";
import { AdminHomeRecentBookings } from "@/features/dashboard/ui/admin-home-recent-bookings";
import { AdminHomeDestinations } from "@/features/dashboard/ui/admin-home-destinations";
import { AdminHomeQuickActions } from "@/features/dashboard/ui/admin-home-quick-actions";

export default function DashboardPage() {
  const { currencySymbol } = useCurrency();
  const { stats, isLoading, error, t } = useAdminHome();
  const locale = useLocale();
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    setUpdatedAt(new Intl.DateTimeFormat(locale).format(new Date()));
  }, [locale]);

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
        {updatedAt ? (
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="hidden sm:flex">
              {t("Dashboard.Home.last-updated")} {updatedAt}
            </Badge>
          </div>
        ) : null}
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
