"use client";

import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";

import { driverDocumentLabel, driverStatusLabel } from "@/features/drivers/lib/driver-document-label";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

export type DriverDocumentFile = {
  type: string;
  fileName: string;
  fileData: string;
  mimeType: string;
  fileSize: number;
  status: string;
};

export function AdminDriverDocumentDialog({
  file,
  loading,
  error,
  open,
  onOpenChange,
}: {
  file: DriverDocumentFile | null;
  loading: boolean;
  error: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Driver");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] w-[95vw] max-w-6xl flex-col overflow-hidden sm:w-full">
        <DialogHeader>
          <DialogTitle className="truncate pe-8 text-base sm:text-lg">
            {file ? `${driverDocumentLabel(t, file.type)} · ${file.fileName}` : t("documents")}
          </DialogTitle>
          <DialogDescription>
            {file ? driverStatusLabel(t, file.status) : t("opening")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? <p className="text-sm text-muted-foreground">{t("opening")}</p> : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {file?.mimeType.startsWith("image/") ? (
            // User-uploaded data URL. next/image does not accept this source.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.fileData}
              alt={file.fileName}
              className="mx-auto max-h-[70vh] w-full object-contain"
            />
          ) : null}
          {file?.mimeType === "application/pdf" ? (
            <iframe src={file.fileData} title={file.fileName} className="h-[70vh] min-h-80 w-full" />
          ) : null}
          {file && !file.mimeType.startsWith("image/") && file.mimeType !== "application/pdf" ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
              <Button type="button" variant="outline" className="h-11" onClick={() => download(file)}>
                {t("view")}
              </Button>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function download(file: DriverDocumentFile) {
  const link = document.createElement("a");
  link.href = file.fileData;
  link.download = file.fileName;
  link.click();
}
