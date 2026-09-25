"use client";

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
    <div className="flex flex-col gap-5">
      <AdminHomeHeader t={t} />
      <AdminHomeQuickActions t={t} />
      <AdminHomeBookingStats t={t} stats={stats} />
      <AdminHomeRecentBookings
        t={t}
        stats={stats}
        currency={currency}
        locale={locale}
      />
      <AdminHomeRevenue
        t={t}
        stats={stats}
        currency={currency}
        locale={locale}
      />
      <AdminHomeDestinations t={t} stats={stats} />
    </div>
  );
}
