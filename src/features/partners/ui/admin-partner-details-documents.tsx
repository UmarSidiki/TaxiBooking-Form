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

export function AdminPartnerDetailsDocuments({
  t,
  selectedPartner,
  formatCurrency,
  formatDate,
  payoutProcessingId,
  handleMarkPayoutPaid,
  handleRecalculatePayout,
  setSelectedDocument,
  setShowDocumentDialog,
}: {
  t: TFn;
  selectedPartner: Partner;
  formatCurrency: AdminPartnersState["formatCurrency"];
  formatDate: AdminPartnersState["formatDate"];
  payoutProcessingId: AdminPartnersState["payoutProcessingId"];
  handleMarkPayoutPaid: AdminPartnersState["handleMarkPayoutPaid"];
  handleRecalculatePayout: AdminPartnersState["handleRecalculatePayout"];
  setSelectedDocument: AdminPartnersState["setSelectedDocument"];
  setShowDocumentDialog: AdminPartnersState["setShowDocumentDialog"];
}) {
  return (
    <>
              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-3">

              {/* Billing & Payout */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <PiggyBank className="w-5 h-5" />
                  {t("billing-information")}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">
                      {t("payout-balance-label")}
                    </p>
                    <p className="text-2xl font-semibold mt-1">
                      {formatCurrency(selectedPartner.payoutBalance)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("last-payout-label", { date: formatDate(selectedPartner.lastPayoutAt) })}
                    </p>
                    <div className="flex flex-col gap-2 mt-3">
                      <Button
                        className="w-full"
                        disabled={
                          (selectedPartner.payoutBalance ?? 0) <= 0 ||
                          payoutProcessingId === selectedPartner._id
                        }
                        onClick={() => handleMarkPayoutPaid(selectedPartner._id)}
                      >
                        {payoutProcessingId === selectedPartner._id ? t("marking-payout") : t("mark-payout-paid")}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={payoutProcessingId === selectedPartner._id}
                        onClick={() => handleRecalculatePayout(selectedPartner._id)}
                      >
                        {payoutProcessingId === selectedPartner._id ? "Recalculating..." : "Recalculate Payout"}
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {t("bank-details")}
                    </p>
                    {(() => {
                      const details = selectedPartner.billingDetails || {};
                      const hasDetails = Object.values(details).some(
                        (value) => typeof value === "string" && value.trim().length > 0
                      );

                      if (!hasDetails) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            {t("missing-billing-details")}
                          </p>
                        );
                      }

                      const detailEntries: Array<{ label: string; value?: string }> = [
                        { label: t("account-holder-label"), value: details.accountHolder },
                        { label: t("bank-name-label"), value: details.bankName },
                        { label: t("account-number-label"), value: details.accountNumber },
                        { label: t("iban-label"), value: details.iban },
                        { label: t("swift-label"), value: details.swift },
                        { label: t("notes-label"), value: details.notes },
                      ];

                      return (
                        <dl className="space-y-2 text-sm">
                          {detailEntries.map((entry) => (
                            <div key={entry.label} className="grid grid-cols-3 gap-2">
                              <dt className="text-muted-foreground">{entry.label}</dt>
                              <dd className="col-span-2 font-medium break-words whitespace-pre-wrap">
                                {entry.value && entry.value.trim().length > 0 ? entry.value : "—"}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      );
                    })()}
                  </div>
                </div>
              </div>
                  {t("documents-count", { 0: selectedPartner.documents.length })}
                </h3>
                {selectedPartner.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("no-documents-uploaded")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedPartner.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize truncate">
                              {doc.type.replace("_", " ")}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {<AdminPartnerDocumentStatusBadge status={doc.status} t={t} />}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowDocumentDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
    </>
  );
}
