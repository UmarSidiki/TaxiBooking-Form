"use client";

import { AdminPartnerDocumentStatusBadge } from "@/components/admin-partners/admin-partner-status-badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { useAdminPartners } from "@/hooks/partners/useAdminPartners";
import { FileText, XCircle } from "lucide-react";
import Image from "next/image";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

export function AdminPartnerDocumentDialog({
  t,
  showDocumentDialog,
  setShowDocumentDialog,
  selectedDocument,
}: Pick<
  AdminPartnersState,
  "t" | "showDocumentDialog" | "setShowDocumentDialog" | "selectedDocument"
>) {
  return (
    <>
      {/* Document Viewer Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] w-[95vw] sm:w-full overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg truncate pr-8">
              {t("document-viewer-title", {
                0: selectedDocument?.type.replace("_", " ").toUpperCase() || "",
                1: selectedDocument?.fileName || ""
              })}
            </DialogTitle>
            <DialogDescription>
              {t("file-size", { 0: selectedDocument ? (selectedDocument.fileSize / 1024).toFixed(0) : 0 })}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="border rounded-lg overflow-auto bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                {selectedDocument.mimeType.startsWith("image/") ? (
                  <div className="w-full p-4">
                    <div className="relative w-full h-[70vh] mx-auto">
                      <Image
                        src={selectedDocument.fileData}
                        alt={selectedDocument.fileName}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                ) : selectedDocument.mimeType === "application/pdf" ? (
                  <iframe
                    src={selectedDocument.fileData}
                    className="w-full h-[70vh] min-h-[500px]"
                    title={selectedDocument.fileName}
                  />
                ) : (
                  <div className="text-center p-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {t("preview-not-available")}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = selectedDocument.fileData;
                        link.download = selectedDocument.fileName;
                        link.click();
                      }}
                    >
                      {t("download-file")}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted rounded-lg flex-shrink-0">
                <div>
                  <p className="text-sm font-medium">{t("document-status")}</p>
                  <div className="mt-1">{<AdminPartnerDocumentStatusBadge status={selectedDocument.status} t={t} />}</div>
                </div>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = selectedDocument.fileData;
                    link.download = selectedDocument.fileName;
                    link.click();
                  }}
                >
                  {t("download")}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDocumentDialog(false)}
            >
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
