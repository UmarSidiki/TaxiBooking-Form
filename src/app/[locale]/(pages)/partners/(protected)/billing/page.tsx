"use client";

import { PartnerBillingForm } from "@/features/partners/ui/partner-billing-form";
import { PartnerBillingStatement } from "@/features/partners/ui/partner-billing-statement";
import { PartnerBillingSummary } from "@/features/partners/ui/partner-billing-summary";
import { usePartnerBilling } from "@/features/partners/hooks/usePartnerBilling";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
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
    <div className="flex flex-col gap-6">
      <DeskPageMeta title={t("title")} description={t("description")} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{billing.t("statement-title")}</h2>
        <a
          className="inline-flex h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
          href={`/api/partners/statement?month=${new Date().toISOString().slice(0, 7)}`}
        >
          {billing.t("download-statement")}
        </a>
      </div>
      <PartnerBillingStatement
        lines={billing.statement}
        emptyLabel={billing.t("statement-empty")}
        regionLabel={billing.t("statement-title")}
        columns={[
          billing.t("col-when"),
          billing.t("col-fare"),
          billing.t("col-margin"),
          billing.t("col-share"),
          billing.t("col-change"),
          billing.t("col-balance"),
        ]}
        entryLabel={(type) => {
          if (type === "ride_credit") return billing.t("entry-ride_credit");
          if (type === "settlement") return billing.t("entry-settlement");
          if (type === "opening_balance") return billing.t("entry-opening_balance");
          if (type === "clawback") return billing.t("entry-clawback");
          return type;
        }}
        formatMoney={(amount) =>
          typeof amount === "number"
            ? new Intl.NumberFormat(undefined, { style: "currency", currency: billing.currency || "EUR" }).format(amount)
            : "—"
        }
      />
      <PartnerBillingSummary
        t={t}
        balance={billing.payoutBalance}
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
