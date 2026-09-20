"use client";

import type { Partner } from "@/features/partners/ui/admin-partner.types";
import { AdminPartnerDocumentStatusBadge } from "@/features/partners/ui/admin-partner-status-badges";
import { Button } from "@/shared/ui/button";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { Eye, FileText } from "lucide-react";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;
type TFn = AdminPartnersState["t"];

export function AdminPartnerDetailsDocuments({
  t,
  selectedPartner,
  setSelectedDocument,
  setShowDocumentDialog,
}: {
  t: TFn;
  selectedPartner: Partner;
  setSelectedDocument: AdminPartnersState["setSelectedDocument"];
  setShowDocumentDialog: AdminPartnersState["setShowDocumentDialog"];
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">
        {t("documents-count", { 0: selectedPartner.documents.length })}
      </h3>
      {selectedPartner.documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("no-documents-uploaded")}</p>
      ) : (
        <div className="space-y-2">
          {selectedPartner.documents.map((doc, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <FileText className="size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium capitalize">
                    {doc.type.replace("_", " ")}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <AdminPartnerDocumentStatusBadge status={doc.status} t={t} />
                <Button
                  variant="outline"
                  className="size-11 p-0"
                  onClick={() => {
                    setSelectedDocument(doc);
                    setShowDocumentDialog(true);
                  }}
                >
                  <Eye className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
