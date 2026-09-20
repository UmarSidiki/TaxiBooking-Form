"use client";

import type { PartnerAccountData } from "@/features/partners/ui/partner-account.types";
import { Card, CardContent } from "@/shared/ui/card";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Dashboard">>;

function Banner({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Clock;
  title: string;
  body: string;
}) {
  return (
    <Card className="desk-card border-border">
      <CardContent className="flex items-start gap-3 p-5">
        <Icon className="mt-0.5 size-5 text-primary" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PartnerAccountBanners({
  t,
  partner,
  hasDocumentsUnderReview,
}: {
  t: TFn;
  partner: PartnerAccountData;
  hasDocumentsUnderReview: boolean | undefined;
}) {
  if (partner.status === "pending" && hasDocumentsUnderReview) {
    return (
      <Banner
        icon={Clock}
        title={t("documents-under-review")}
        body={t("your-documents-are-currently-being-reviewed")}
      />
    );
  }
  if (partner.status === "pending" && !hasDocumentsUnderReview) {
    return (
      <Banner
        icon={AlertCircle}
        title={t("action-required-upload-documents")}
        body={t("please-upload-all-required-documents")}
      />
    );
  }
  if (partner.status === "rejected") {
    return (
      <Banner
        icon={XCircle}
        title={t("account-rejected")}
        body={partner.rejectionReason || t("your-account-has-been-rejected")}
      />
    );
  }
  if (partner.status === "approved") {
    return (
      <Banner
        icon={CheckCircle2}
        title={t("account-approved")}
        body={t("your-account-has-been-approved")}
      />
    );
  }
  return null;
}
