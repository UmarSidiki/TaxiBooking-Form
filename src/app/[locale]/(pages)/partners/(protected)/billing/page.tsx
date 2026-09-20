"use client";

import { PartnerBillingForm } from "@/features/partners/ui/partner-billing-form";
import { PartnerBillingSummary } from "@/features/partners/ui/partner-billing-summary";
import { usePartnerBilling } from "@/features/partners/hooks/usePartnerBilling";
import { Loader2 } from "lucide-react";

export default function PartnerBillingPage() {
  const billing = usePartnerBilling();
  const { t, loading } = billing;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mb-4 size-8 animate-spin text-primary" />
        <p className="text-sm">{t("title")}…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <PartnerBillingSummary
        t={t}
        formattedBalance={billing.formattedBalance}
        formattedLastPaid={billing.formattedLastPaid}
      />
      <PartnerBillingForm
        t={t}
        formState={billing.formState}
        saving={billing.saving}
        error={billing.error}
        success={billing.success}
        handleChange={billing.handleChange}
        handleSubmit={billing.handleSubmit}
      />
    </div>
  );
}
