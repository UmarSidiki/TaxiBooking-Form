"use client";

import {
  AdminPartnerStatusBadge,
} from "@/features/partners/ui/admin-partner-status-badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { Clock, Users } from "lucide-react";
import { useLocale } from "next-intl";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

export function AdminPartnerList({
  t,
  filteredPartners,
  setSelectedPartner,
  setShowDetailsDialog,
  formatCurrency,
}: Pick<
  AdminPartnersState,
  "t" | "filteredPartners" | "setSelectedPartner" | "setShowDetailsDialog" | "formatCurrency"
>) {
  const locale = useLocale();
  const openPartner = (partner: AdminPartnersState["filteredPartners"][number]) => {
    setSelectedPartner(partner);
    setShowDetailsDialog(true);
  };

  return (
    <>
      {/* Partners List */}
      <Card className="desk-card border-border">
        <CardHeader>
          <CardTitle>{t("partners-count", { 0: filteredPartners.length })}</CardTitle>
          <CardDescription>
            {t("click-to-view-details")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPartners.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center text-center text-muted-foreground">
              <div className="mb-3 flex size-12 items-center justify-center rounded-md bg-muted">
                <Users className="size-6" aria-hidden="true" />
              </div>
              <p>{t("no-partners-found")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPartners.map((partner) => (
                <div
                  key={partner._id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${t("partner-details")}: ${partner.name}`}
                  className="flex cursor-pointer flex-col gap-3 rounded-md border p-4 transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:flex-row sm:items-center"
                  onClick={() => openPartner(partner)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openPartner(partner);
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="size-5 text-primary" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{partner.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {partner.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("registered")}{" "}
                          {new Date(partner.registeredAt).toLocaleDateString(locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <div className="text-left sm:text-right">
                          <p className="text-sm text-muted-foreground">{t("documents")}</p>
                          <p className="text-sm font-medium">
                            {partner.documents.length} {t("uploaded")}
                          </p>
                          {partner.fleetStatus === "pending" && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                <Clock className="size-3" aria-hidden="true" />
                                {t("fleet-pending")}
                              </span>
                              {partner.requestedFleet && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {t("vehicle-requested")}
                                </p>
                              )}
                            </div>
                          )}
                          {/* Earnings display */}
                          {partner.totalEarnings !== undefined && partner.totalEarnings > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">{t("total-earnings")}</p>
                              <p className="text-sm font-bold text-primary">
                                {formatCurrency(partner.totalEarnings)}
                              </p>
                              {partner.onlineEarnings !== undefined && partner.cashEarnings !== undefined && (
                                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                  <div className="flex justify-between">
                                    <span>{t("online-payment")}</span>
                                    <span>{formatCurrency(partner.onlineEarnings)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{t("cash-payment")}</span>
                                    <span>{formatCurrency(partner.cashEarnings)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <AdminPartnerStatusBadge status={partner.status} t={t} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
