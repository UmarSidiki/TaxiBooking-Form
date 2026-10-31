"use client";

import type { Partner } from "@/features/partners/ui/admin-partner.types";
import { AdminPartnerStatusBadge } from "@/features/partners/ui/admin-partner-status-badges";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { PiggyBank } from "lucide-react";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;
type TFn = AdminPartnersState["t"];

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium break-words" title={value} dir="auto">
        {value}
      </p>
    </div>
  );
}

export function AdminPartnerDetailsProfile({
  t,
  selectedPartner,
  formatCurrency,
}: {
  t: TFn;
  selectedPartner: Partner;
  formatCurrency: AdminPartnersState["formatCurrency"];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          {t("status")}
        </p>
        <AdminPartnerStatusBadge status={selectedPartner.status} t={t} />
      </div>

      <div>
        <h3 className="mb-3 font-semibold">{t("personal-information")}</h3>
        <div className="drawer-grid">
          <Field label={t("name")} value={selectedPartner.name} />
          <Field label={t("email")} value={selectedPartner.email} />
          <Field label={t("phone")} value={selectedPartner.phone} />
          <Field label={t("city")} value={selectedPartner.city} />
          <Field label={t("country")} value={selectedPartner.country} />
        </div>

        {selectedPartner.totalEarnings !== undefined &&
        selectedPartner.totalEarnings > 0 ? (
          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <PiggyBank className="size-5" aria-hidden="true" />
              {t("earnings-summary")}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("total-earnings")}
                </p>
                <p className="text-xl font-bold tabular-nums text-foreground">
                  {formatCurrency(selectedPartner.totalEarnings)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("online-payment")}
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(selectedPartner.onlineEarnings)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("cash-payment")}
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(selectedPartner.cashEarnings)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
