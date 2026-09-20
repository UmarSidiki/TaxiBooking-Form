"use client";

import type { Partner, PartnerDocument, Vehicle } from "@/components/admin-partners/admin-partner.types";
import {
  AdminPartnerDocumentStatusBadge,
  AdminPartnerStatusBadge,
} from "@/components/admin-partners/admin-partner-status-badges";
import { Button } from "@/components/ui/button";
import type { useAdminPartners } from "@/hooks/partners/useAdminPartners";
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
}: {
  t: TFn;
  selectedPartner: Partner;
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
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      {t("earnings-summary")}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-green-700 dark:text-green-300">{t("total-earnings")}</p>
                        <p className="text-xl font-bold text-green-900 dark:text-green-100">
                          €{selectedPartner.totalEarnings?.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-green-700 dark:text-green-300">{t("online-payment")}</p>
                        <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                          €{selectedPartner.onlineEarnings?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-green-700 dark:text-green-300">{t("cash-payment")}</p>
                        <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                          €{selectedPartner.cashEarnings?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

    </>
  );
}
