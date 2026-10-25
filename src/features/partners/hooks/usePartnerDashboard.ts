"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/shared/context/currency-context";
import type {
  PartnerAvailableRide,
  PartnerDashboardFleetInfo,
  PartnerDashboardProfile,
  PartnerRideStats,
} from "@/features/partners/ui/partner-dashboard.types";

export function usePartnerDashboard() {
  const t = useTranslations("Dashboard.Partners.Dashboard");
  const { currencySymbol } = useCurrency();
  const [partner, setPartner] = useState<PartnerDashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<PartnerRideStats | null>(null);
  const [fleetInfo, setFleetInfo] = useState<PartnerDashboardFleetInfo | null>(null);
  const [availableRides, setAvailableRides] = useState<PartnerAvailableRide[]>([]);
  const [acceptingRide, setAcceptingRide] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const lastVisibleRefresh = useRef(0);

  const fetchPartnerData = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetch("/api/partners/profile");
      const data = await response.json();
      if (!response.ok) {
        setLoadError(t("failed-to-load-partner-data"));
        return;
      }
      setPartner(data.partner);
      setFleetInfo({
        fleetStatus: data.partner.currentFleet
          ? "approved"
          : data.partner.fleetStatus || "none",
      });
    } catch {
      setLoadError(t("failed-to-load-partner-data"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/partners/stats");
      const data = await response.json();
      if (response.ok) setStats(data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const fetchAvailableRides = useCallback(async () => {
    try {
      const response = await fetch("/api/partners/rides/available");
      const data = await response.json();
      if (response.ok) setAvailableRides(data.rides || []);
    } catch (error) {
      console.error("Error fetching available rides:", error);
    }
  }, []);

  useEffect(() => {
    void fetchPartnerData();
  }, [fetchPartnerData]);

  useEffect(() => {
    if (partner?.status !== "approved" && partner?.status !== "active") return;
    void fetchStats();
    void fetchAvailableRides();
    lastVisibleRefresh.current = Date.now();

    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastVisibleRefresh.current < 1500) return;
      lastVisibleRefresh.current = now;
      void fetchAvailableRides();
      void fetchStats();
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      lastVisibleRefresh.current = Date.now();
      void fetchAvailableRides();
    }, 30_000);

    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [partner?.status, fetchStats, fetchAvailableRides]);

  const acceptRide = async (rideId: string) => {
    setAcceptingRide(rideId);
    try {
      const response = await fetch(`/api/partners/rides/${rideId}/accept`, {
        method: "POST",
      });
      if (response.ok) {
        setAvailableRides((prev) => prev.filter((ride) => ride._id !== rideId));
        void fetchStats();
        setNotice(t("ride-accepted-successfully"));
      } else {
        setNotice(t("failed-to-accept-ride"));
      }
    } catch {
      setNotice(t("failed-to-accept-ride"));
    } finally {
      setAcceptingRide(null);
    }
  };

  return {
    t,
    currencySymbol,
    partner,
    loading,
    loadError,
    stats,
    fleetInfo,
    availableRides,
    acceptingRide,
    notice,
    setNotice,
    fetchPartnerData,
    acceptRide,
  };
}
