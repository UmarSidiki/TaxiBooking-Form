"use client";

import { FileText, Loader2 } from "lucide-react";

import { useDriverAccount } from "@/features/drivers/hooks/use-driver-account";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const TYPES = ["license", "id", "insurance", "registration", "other"] as const;

export function DriverAccountPage() {
  const account = useDriverAccount();
  const { t } = account;

  if (account.loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t("account-loading")}
      </p>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      {account.status !== "approved" ? (
        <div className="rounded-md border border-border bg-card p-4">
          <h1 className="text-lg font-semibold">{t("waiting-title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("waiting-body")}</p>
        </div>
      ) : (
        <h1 className="text-lg font-semibold">{t("account")}</h1>
      )}

      <form
        className="flex flex-col gap-4 rounded-md border border-border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          account.upload();
        }}
      >
        <h2 className="text-sm font-semibold">{t("upload-documents")}</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="driver-document-type">{t("document-type")}</Label>
          <Select value={account.documentType} onValueChange={account.setDocumentType}>
            <SelectTrigger id="driver-document-type" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`doc-${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="driver-document-file">{t("select-file")}</Label>
          <Input
            id="driver-document-file"
            key={account.fileKey}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="h-11 file:me-3 file:text-sm file:font-medium file:text-foreground"
            onChange={account.onFile}
          />
        </div>
        {account.error ? (
          <p className="text-sm text-destructive" role="alert">
            {account.error}
          </p>
        ) : null}
        <Button
          type="submit"
          className="h-11 disabled:bg-muted disabled:text-foreground disabled:opacity-100"
          disabled={!account.file || account.uploading}
        >
          {account.uploading ? t("uploading") : t("upload")}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{t("documents")}</h2>
        {account.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no-documents")}</p>
        ) : (
          account.documents.map((doc) => (
            <div
              key={`${doc.fileName}-${doc.uploadedAt}`}
              className="flex items-center gap-3 rounded-md border border-border p-3"
            >
              <FileText className="size-4 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.fileName}</p>
                <p className="text-xs text-muted-foreground">{t(`doc-${doc.type}`)}</p>
              </div>
              <span className="text-xs text-muted-foreground">{t(`status-${doc.status}`)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
