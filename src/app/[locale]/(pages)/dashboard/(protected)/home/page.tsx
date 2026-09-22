"use client";

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
  const { currency } = useCurrency();
  const { stats, isLoading, error, t } = useAdminHome();
  const locale = useLocale();
  const updatedAt = new Intl.DateTimeFormat(locale).format(new Date());

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
    <div className="flex flex-col gap-6">
      <AdminHomeHeader t={t}>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex">
            <span suppressHydrationWarning>
              {t("Dashboard.Home.last-updated")} {updatedAt}
            </span>
          </Badge>
        </div>
      </AdminHomeHeader>

      <AdminHomeRecentBookings
        t={t}
        stats={stats}
        currency={currency}
        locale={locale}
      />

      <AdminHomeBookingStats t={t} stats={stats} />

      <AdminHomeRevenue
        t={t}
        stats={stats}
        currency={currency}
        locale={locale}
      />

      <AdminHomeDestinations t={t} stats={stats} />

      <AdminHomeQuickActions t={t} />
    </div>
  );
}
