"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/shared/http/api";
import type { DashboardStats } from "@/features/dashboard/ui/admin-home.types";

export function useAdminHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return { stats, isLoading, error, t };
}
