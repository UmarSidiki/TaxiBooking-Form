"use client";

import { useEffect, useState } from "react";
import type { Partner } from "@/features/partners/ui/admin-partner.types";
import { Button } from "@/shared/ui/button";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { CreditCard, PiggyBank } from "lucide-react";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;
type TFn = AdminPartnersState["t"];

type SettlementEntry = {
  _id: string;
  type: string;
  amount: number;
  currency: string;
  note?: string;
  createdAt?: string;
  bookingId?: string;
};

export function AdminPartnerDetailsBilling({
  t,
  selectedPartner,
  formatCurrency,
  formatDate,
  payoutProcessingId,
  handleMarkPayoutPaid,
  handleMarkRemittanceReceived,
  handleRecalculatePayout,
}: {
  t: TFn;
  selectedPartner: Partner;
  formatCurrency: AdminPartnersState["formatCurrency"];
  formatDate: AdminPartnersState["formatDate"];
  payoutProcessingId: AdminPartnersState["payoutProcessingId"];
  handleMarkPayoutPaid: AdminPartnersState["handleMarkPayoutPaid"];
  handleMarkRemittanceReceived: AdminPartnersState["handleMarkRemittanceReceived"];
  handleRecalculatePayout: AdminPartnersState["handleRecalculatePayout"];
}) {
  const details = selectedPartner.billingDetails || {};
  const hasDetails = Object.values(details).some(
    (value) => typeof value === "string" && value.trim().length > 0
  );
  const busy = payoutProcessingId === selectedPartner._id;
  const [entries, setEntries] = useState<SettlementEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLedgerLoading(true);
    void fetch(`/api/admin/partners/${selectedPartner._id}/settlements`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && Array.isArray(data.entries)) {
          setEntries(data.entries);
        }
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLedgerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    selectedPartner._id,
    selectedPartner.payoutBalance,
    selectedPartner.remittanceBalance,
  ]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 font-semibold">
        <PiggyBank className="size-5" aria-hidden="true" />
        {t("billing-information")}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {t("payout-balance-label")}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatCurrency(selectedPartner.payoutBalance)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("last-payout-label", {
                date: formatDate(selectedPartner.lastPayoutAt),
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("remittance-balance-label")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatCurrency(selectedPartner.remittanceBalance)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("last-remittance-label", {
                date: formatDate(selectedPartner.lastRemittanceAt),
              })}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="h-11 w-full"
              disabled={(selectedPartner.payoutBalance ?? 0) <= 0 || busy}
              onClick={() => handleMarkPayoutPaid(selectedPartner._id)}
            >
              {busy ? t("marking-payout") : t("mark-payout-paid")}
            </Button>
            <Button
              className="h-11 w-full"
              variant="secondary"
              disabled={(selectedPartner.remittanceBalance ?? 0) <= 0 || busy}
              onClick={() =>
                handleMarkRemittanceReceived(selectedPartner._id)
              }
            >
              {busy ? t("marking-remittance") : t("mark-remittance-received")}
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
            <CreditCard className="size-4" aria-hidden="true" />
            {t("bank-details")}
          </p>
          {!hasDetails ? (
            <p className="text-sm text-muted-foreground">
              {t("missing-billing-details")}
            </p>
          ) : (
            <dl className="flex flex-col gap-2 text-sm">
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
                  <dd className="col-span-2 break-words font-medium">
                    {entry.value?.trim() ? entry.value : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border p-4">
        <h4 className="mb-3 text-sm font-semibold">{t("settlement-ledger")}</h4>
        {ledgerLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading-ledger")}</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty-ledger")}</p>
        ) : (
          <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {entries.map((entry) => (
              <li
                key={entry._id}
                className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 text-sm last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {t(`settlement-type-${entry.type}` as "settlement-type-payout_credit")}
                  </p>
                  {entry.note ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.note}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {entry.createdAt
                      ? formatDate(entry.createdAt)
                      : "—"}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {formatCurrency(entry.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
