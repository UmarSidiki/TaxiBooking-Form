"use client";

import type { Partner } from "@/features/partners/ui/admin-partner.types";
import { Button } from "@/shared/ui/button";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { CreditCard, PiggyBank } from "lucide-react";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;
type TFn = AdminPartnersState["t"];

export function AdminPartnerDetailsBilling({
  t,
  selectedPartner,
  formatCurrency,
  formatDate,
  payoutProcessingId,
  handleMarkPayoutPaid,
  handleRecalculatePayout,
}: {
  t: TFn;
  selectedPartner: Partner;
  formatCurrency: AdminPartnersState["formatCurrency"];
  formatDate: AdminPartnersState["formatDate"];
  payoutProcessingId: AdminPartnersState["payoutProcessingId"];
  handleMarkPayoutPaid: AdminPartnersState["handleMarkPayoutPaid"];
  handleRecalculatePayout: AdminPartnersState["handleRecalculatePayout"];
}) {
  const details = selectedPartner.billingDetails || {};
  const hasDetails = Object.values(details).some(
    (value) => typeof value === "string" && value.trim().length > 0
  );
  const busy = payoutProcessingId === selectedPartner._id;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 font-semibold">
        <PiggyBank className="size-5" />
        {t("billing-information")}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border p-4">
          <p className="text-sm text-muted-foreground">{t("payout-balance-label")}</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(selectedPartner.payoutBalance)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("last-payout-label", { date: formatDate(selectedPartner.lastPayoutAt) })}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button
              className="h-11 w-full"
              disabled={(selectedPartner.payoutBalance ?? 0) <= 0 || busy}
              onClick={() => handleMarkPayoutPaid(selectedPartner._id)}
            >
              {busy ? t("marking-payout") : t("mark-payout-paid")}
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full"
              disabled={busy}
              onClick={() => handleRecalculatePayout(selectedPartner._id)}
            >
              {busy ? t("marking-payout") : t("recalculate-payout")}
            </Button>
          </div>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <CreditCard className="size-4" />
            {t("bank-details")}
          </p>
          {!hasDetails ? (
            <p className="text-sm text-muted-foreground">{t("missing-billing-details")}</p>
          ) : (
            <dl className="space-y-2 text-sm">
              {[
                { label: t("account-holder-label"), value: details.accountHolder },
                { label: t("bank-name-label"), value: details.bankName },
                { label: t("account-number-label"), value: details.accountNumber },
                { label: t("iban-label"), value: details.iban },
                { label: t("swift-label"), value: details.swift },
                { label: t("notes-label"), value: details.notes },
              ].map((entry) => (
                <div key={entry.label} className="grid grid-cols-3 gap-2">
                  <dt className="text-muted-foreground">{entry.label}</dt>
                  <dd className="col-span-2 font-medium break-words">
                    {entry.value?.trim() ? entry.value : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
