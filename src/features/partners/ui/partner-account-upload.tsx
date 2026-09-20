"use client";

import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { ChangeEvent } from "react";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Dashboard">>;

export function PartnerAccountUpload({
  t,
  documentType,
  setDocumentType,
  selectedFile,
  setSelectedFile,
  error,
  success,
  fileInputKey,
  uploading,
  handleFileChange,
  handleUpload,
}: {
  t: TFn;
  documentType: string;
  setDocumentType: (value: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  error: string | null;
  success: string | null;
  fileInputKey: number;
  uploading: boolean;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => void;
}) {
  return (
    <Card className="desk-card border-border">
      <CardHeader>
        <CardTitle>{t("upload-documents")}</CardTitle>
        <CardDescription>{t("upload-required-documents-for-verification")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="document-type">
              {t("document-type")}
            </label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type" className="h-11">
                <SelectValue placeholder={t("select-document-type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="license">{t("drivers-license")}</SelectItem>
                <SelectItem value="insurance">{t("insurance")}</SelectItem>
                <SelectItem value="liability_insurance">
                  {t("professional-liability-insurance-rc-pro")}
                </SelectItem>
                <SelectItem value="registration">{t("vehicle-registration")}</SelectItem>
                <SelectItem value="id">{t("id-card")}</SelectItem>
                <SelectItem value="vtc">{t("vtc-card")}</SelectItem>
                <SelectItem value="other">{t("other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="document-file">
              {t("select-file")}
            </label>
            <Input
              id="document-file"
              key={fileInputKey}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="h-11"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
        </div>
        {selectedFile ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-3">
            <FileText className="size-5 text-primary" />
            <span className="flex-1 text-sm">{selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-11"
              onClick={() => setSelectedFile(null)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
        {error ? (
          <p className="rounded-md border border-border px-4 py-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-md border border-border px-4 py-3 text-sm" role="status">
            {success}
          </p>
        ) : null}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !documentType || uploading}
          className="h-11 w-full md:w-auto"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? t("uploading") : t("upload-document")}
        </Button>
      </CardContent>
    </Card>
  );
}
