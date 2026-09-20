"use client";

import { useCallback, useEffect, useState } from "react";
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
    if (partner?.status !== "approved") return;
    void fetchStats();
    void fetchAvailableRides();
    const interval = setInterval(fetchAvailableRides, 30000);
    return () => clearInterval(interval);
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
