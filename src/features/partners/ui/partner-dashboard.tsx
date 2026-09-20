"use client";

import { PartnerDashboardAvailable } from "@/features/partners/ui/partner-dashboard-available";
import { PartnerDashboardNotices } from "@/features/partners/ui/partner-dashboard-notices";
import { PartnerDashboardStats } from "@/features/partners/ui/partner-dashboard-stats";
import { usePartnerDashboard } from "@/features/partners/hooks/usePartnerDashboard";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";

export function PartnerDashboard() {
  const {
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
  } = usePartnerDashboard();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mb-4 size-8 animate-spin text-primary" />
        <p className="text-sm">{t("loading")}…</p>
      </div>
    );
  }

  if (loadError || !partner) {
    return (
      <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="alert">
        {loadError || t("failed-to-load-partner-data")}
        <Button variant="outline" className="ms-3 h-11" onClick={() => void fetchPartnerData()}>
          {t("retry")}
        </Button>
      </p>
    );
  }

  const isApproved = partner.status === "approved";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("dashboard")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("your-partner-account-details")}</p>
      </div>
      {notice ? (
        <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="status">
          {notice}
          <button
            type="button"
            className="ms-3 text-primary underline-offset-4 hover:underline"
            onClick={() => setNotice(null)}
          >
            {t("dismiss")}
          </button>
        </p>
      ) : null}
      {isApproved && stats ? (
        <PartnerDashboardStats t={t} stats={stats} currencySymbol={currencySymbol} />
      ) : null}
      <PartnerDashboardNotices t={t} isApproved={isApproved} fleetInfo={fleetInfo} />
      {isApproved && fleetInfo?.fleetStatus === "approved" ? (
        <PartnerDashboardAvailable
          t={t}
          rides={availableRides}
          currencySymbol={currencySymbol}
          acceptingRide={acceptingRide}
          onAccept={acceptRide}
        />
      ) : null}
    </div>
  );
}
