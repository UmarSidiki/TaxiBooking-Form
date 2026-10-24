"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, FileText } from "lucide-react";

import type { IDriverDocument } from "@/features/drivers/model";
import { driverDocumentLabel, driverStatusLabel } from "@/features/drivers/lib/driver-document-label";
import {
  AdminDriverDocumentDialog,
  type DriverDocumentFile,
} from "@/features/drivers/ui/admin-driver-document-dialog";
import { Button } from "@/shared/ui/button";
import { apiGet } from "@/shared/http/api";

export function AdminDriverDocuments({
  driverId,
  documents,
}: {
  driverId: string;
  documents: IDriverDocument[];
}) {
  const t = useTranslations("Driver");
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<DriverDocumentFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDocument = async (documentId: string) => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setFile(null);
    try {
      const result = await apiGet<{ success: boolean; data: DriverDocumentFile }>(
        `/api/admin/drivers/${driverId}/documents/${documentId}`,
      );
      setFile(result.data);
    } catch {
      setError(t("document-open-failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">{t("documents")}</h3>
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("no-documents")}</p>
      ) : (
        documents.map((document) => (
          <div
            key={document._id ?? document.fileName}
            className="flex items-center gap-3 rounded-md border border-border p-3"
          >
            <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{document.fileName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {driverDocumentLabel(t, document.type)} · {driverStatusLabel(t, document.status)}
              </p>
            </div>
            {document._id ? (
              <Button
                type="button"
                variant="outline"
                className="size-11 shrink-0"
                aria-label={`${t("view")}: ${document.fileName}`}
                onClick={() => void openDocument(document._id ?? "")}
              >
                <Eye className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        ))
      )}
      <AdminDriverDocumentDialog
        file={file}
        loading={loading}
        error={error}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
