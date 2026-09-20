"use client";

import { Card, CardContent } from "@/shared/ui/card";
import type { PartnerDashboardFleetInfo } from "@/features/partners/ui/partner-dashboard.types";
import { AlertCircle, Clock } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Dashboard">>;

export function PartnerDashboardNotices({
  t,
  isApproved,
  fleetInfo,
}: {
  t: TFn;
  isApproved: boolean;
  fleetInfo: PartnerDashboardFleetInfo | null;
}) {
  if (!isApproved) {
    return (
      <Card className="desk-card border-border">
        <CardContent className="flex items-start gap-3 p-5">
          <AlertCircle className="mt-0.5 size-5 text-primary" />
          <div>
            <h3 className="font-semibold">{t("account-not-approved")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard-available-after-approval")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fleetInfo?.fleetStatus !== "pending") return null;

  return (
    <Card className="desk-card border-border">
      <CardContent className="flex items-start gap-3 p-5">
        <Clock className="mt-0.5 size-5 text-primary" />
        <div>
          <h3 className="font-semibold">{t("fleet-request-pending")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("waiting-for-fleet-approval")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{t("check-fleet-section")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
