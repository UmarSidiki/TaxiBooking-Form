"use client";

import { useEffect, useState } from "react";
import type { Partner } from "@/features/partners/ui/admin-partner.types";
import { AdminPartnerSettleDialog } from "@/features/partners/ui/admin-partner-settle-dialog";
import { PartnerBillingStatement, type StatementLine } from "@/features/partners/ui/partner-billing-statement";
import { Button } from "@/shared/ui/button";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { PiggyBank } from "lucide-react";
import { readPartnerBalance } from "@/features/partners/lib/partner-share-delta";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

function settlementLabel(t: AdminPartnersState["t"], type: string) {
  if (type === "ride_credit") return t("settlement-type-ride_credit");
  if (type === "settlement") return t("settlement-type-settlement");
  if (type === "opening_balance") return t("settlement-type-opening_balance");
  if (type === "clawback") return t("settlement-type-clawback");
  if (type === "payout_credit") return t("settlement-type-payout_credit");
  if (type === "payout_paid") return t("settlement-type-payout_paid");
  if (type === "remittance_credit") return t("settlement-type-remittance_credit");
  if (type === "remittance_received") return t("settlement-type-remittance_received");
  return type;
}

export function AdminPartnerDetailsBilling({
  t,
  selectedPartner,
  formatCurrency,
}: {
  t: AdminPartnersState["t"];
  selectedPartner: Partner;
  formatCurrency: AdminPartnersState["formatCurrency"];
}) {
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [balance, setBalance] = useState(readPartnerBalance(selectedPartner));
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/admin/partners/${selectedPartner._id}/settlements`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setLines(Array.isArray(data.entries) ? data.entries : []);
          if (typeof data.balance === "number") setBalance(data.balance);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPartner._id]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <PiggyBank className="size-5" aria-hidden="true" />
            {t("balance-label")}
          </h3>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(balance)}</p>
          <p className="text-xs text-muted-foreground">{t("balance-hint")}</p>
        </div>
        <Button className="h-11" onClick={() => setOpen(true)}>{t("settle-open")}</Button>
      </div>
      {loading ? (
        <p role="status" className="text-sm text-muted-foreground">{t("loading-ledger")}</p>
      ) : (
        <PartnerBillingStatement
          lines={lines}
          emptyLabel={t("empty-ledger")}
          columns={[t("col-when"), t("col-fare"), t("col-margin"), t("col-share"), t("col-change"), t("col-balance")]}
          entryLabel={(type) => settlementLabel(t, type)}
          formatMoney={(amount) => (typeof amount === "number" ? formatCurrency(amount) : "—")}
        />
      )}
      <AdminPartnerSettleDialog
        t={t}
        partnerId={selectedPartner._id}
        open={open}
        onOpenChange={setOpen}
        onSettled={(next) => {
          setBalance(next);
          setLines([]);
          void fetch(`/api/admin/partners/${selectedPartner._id}/settlements`)
            .then((response) => response.json())
            .then((data) => {
              if (data.success && Array.isArray(data.entries)) setLines(data.entries);
            });
        }}
      />
    </div>
  );
}
