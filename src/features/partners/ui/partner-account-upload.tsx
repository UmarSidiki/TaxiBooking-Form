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
import { FileText, Trash2, Upload } from "lucide-react";
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
      <Card>
        <CardHeader>
          <CardTitle>{t("upload-documents")}</CardTitle>
          <CardDescription>
            {t("upload-required-documents-for-verification")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("document-type")}</label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select-document-type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="license">{t("drivers-license")}</SelectItem>
                    <SelectItem value="insurance">{t("insurance")}</SelectItem>
                    <SelectItem value="liability_insurance">{t("professional-liability-insurance-rc-pro")}</SelectItem>
                    <SelectItem value="registration">
                      {t("vehicle-registration")}
                    </SelectItem>
                    <SelectItem value="id">{t("id-card")}</SelectItem>
                    <SelectItem value="vtc">{t("vtc-card")}</SelectItem>
                    <SelectItem value="other">{t("other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("select-file")}</label>
                <Input
                  key={fileInputKey}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm flex-1">{selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !documentType || uploading}
              className="w-full md:w-auto"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("uploading")}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t("upload-document")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
  );
}
