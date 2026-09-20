"use client";

import {
  AdminPartnerStatusBadge,
} from "@/features/partners/ui/admin-partner-status-badges";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { Clock, Eye, Users } from "lucide-react";
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
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("no-partners-found")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPartners.map((partner) => (
                <div
                  key={partner._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedPartner(partner);
                    setShowDetailsDialog(true);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
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
                                <Clock className="w-3 h-3" />
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
                      {<AdminPartnerStatusBadge status={partner.status} t={t} />}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
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
