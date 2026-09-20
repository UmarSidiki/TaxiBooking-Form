"use client";

import { PartnerAccountStatusBadge } from "@/components/partner-account/partner-account-status-badge";
import type { PartnerAccountData } from "@/components/partner-account/partner-account.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Dashboard">>;

export function PartnerAccountProfile({
  t,
  partner,
}: {
  t: TFn;
  partner: PartnerAccountData;
}) {
  return (
      <Card>
        <CardHeader>
          <CardTitle>{t("profile-information")}</CardTitle>
          <CardDescription>{t("your-partner-account-details")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("name")}</p>
              <p className="text-base font-semibold">{partner.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("email")}</p>
              <p className="text-base font-semibold">{partner.email}</p>
            </div>
            {partner.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("phone")}
                </p>
                <p className="text-base font-semibold">{partner.phone}</p>
              </div>
            )}
            {partner.city && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("city")}</p>
                <p className="text-base font-semibold">{partner.city}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("account-status")}
              </p>
              <div className="mt-1">
                <PartnerAccountStatusBadge status={partner.status} t={t} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
