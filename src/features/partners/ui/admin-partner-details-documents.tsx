"use client";

import { useState } from "react";
import type { Partner, PartnerDocument } from "@/features/partners/ui/admin-partner.types";
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
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const openDocument = async (doc: PartnerDocument) => {
    if (!doc._id) return;
    setOpenError(null);
    setOpeningId(doc._id);
    try {
      const response = await fetch(
        `/api/admin/partners/${selectedPartner._id}/documents/${doc._id}`,
      );
      const body = (await response.json()) as {
        success?: boolean;
        data?: PartnerDocument;
      };
      if (!response.ok || !body.success || !body.data?.fileData) {
        setOpenError(t("document-load-error"));
        return;
      }
      setSelectedDocument({ ...doc, ...body.data });
      setShowDocumentDialog(true);
    } catch {
      setOpenError(t("document-load-error"));
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">
        {t("documents-count", { 0: selectedPartner.documents?.length ?? 0 })}
      </h3>
      {openingId ? (
        <p className="text-sm text-muted-foreground" role="status">
          {t("loading-document")}
        </p>
      ) : null}
      {openError ? (
        <p className="text-sm text-destructive" role="alert">
          {openError}
        </p>
      ) : null}
      {(selectedPartner.documents?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">{t("no-documents-uploaded")}</p>
      ) : (
        <div className="space-y-2">
          {(selectedPartner.documents ?? []).map((doc, index) => (
            <div
              key={doc._id ?? index}
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
                  aria-label={t("view-document")}
                  disabled={!doc._id || openingId === doc._id}
                  onClick={() => void openDocument(doc)}
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
