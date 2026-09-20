"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PiggyBank } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Billing">>;

export function PartnerBillingSummary({
  t,
  formattedBalance,
  formattedLastPaid,
}: {
  t: TFn;
  formattedBalance: string;
  formattedLastPaid: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="desk-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("payout-summary-title")}</CardTitle>
          <PiggyBank className="size-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight">{formattedBalance}</div>
          <p className="mt-1 text-xs text-muted-foreground">{t("payout-summary-description")}</p>
          <p className="mt-4 text-sm text-muted-foreground">{t("last-paid", { date: formattedLastPaid })}</p>
        </CardContent>
      </Card>
      <Card className="desk-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("instructions-title")}</CardTitle>
          <CardDescription>{t("instructions-description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
            <li>{t("instructions-1")}</li>
            <li>{t("instructions-2")}</li>
            <li>{t("instructions-3")}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
