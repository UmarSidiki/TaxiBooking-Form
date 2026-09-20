"use client";

import type { Partner, PartnerDocument, Vehicle } from "@/features/partners/ui/admin-partner.types";
import {
  AdminPartnerDocumentStatusBadge,
  AdminPartnerStatusBadge,
} from "@/features/partners/ui/admin-partner-status-badges";
import { Button } from "@/shared/ui/button";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileText,
  PiggyBank,
  Truck,
  XCircle,
} from "lucide-react";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;
type TFn = AdminPartnersState["t"];

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
    <>
              {/* Status */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("status")}
                </p>
                {<AdminPartnerStatusBadge status={selectedPartner.status} t={t} />}
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="font-semibold mb-3">{t("personal-information")}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("name")}</p>
                    <p className="font-medium">{selectedPartner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("email")}</p>
                    <p className="font-medium">{selectedPartner.email}</p>
                  </div>
                  {selectedPartner.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("phone")}</p>
                      <p className="font-medium">{selectedPartner.phone}</p>
                    </div>
                  )}
                  {selectedPartner.city && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("city")}</p>
                      <p className="font-medium">{selectedPartner.city}</p>
                    </div>
                  )}
                  {selectedPartner.country && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("country")}</p>
                      <p className="font-medium">{selectedPartner.country}</p>
                    </div>
                  )}
                </div>

                {/* Earnings Summary */}
                {(selectedPartner.totalEarnings !== undefined && selectedPartner.totalEarnings > 0) && (
                  <div className="mt-6 rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                      <PiggyBank className="size-5" />
                      {t("earnings-summary")}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{t("total-earnings")}</p>
                        <p className="text-xl font-bold text-foreground">
                          {formatCurrency(selectedPartner.totalEarnings)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{t("online-payment")}</p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatCurrency(selectedPartner.onlineEarnings)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{t("cash-payment")}</p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatCurrency(selectedPartner.cashEarnings)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

    </>
  );
}
