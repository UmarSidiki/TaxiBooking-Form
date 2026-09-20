"use client";

import { PartnerAccountStatusBadge } from "@/features/partners/ui/partner-account-status-badge";
import type { PartnerAccountData } from "@/features/partners/ui/partner-account.types";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { FileText } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Dashboard">>;

export function PartnerAccountDocuments({
  t,
  partner,
}: {
  t: TFn;
  partner: PartnerAccountData;
}) {
  return (
      <Card>
        <CardHeader>
          <CardTitle>{t("uploaded-documents")}</CardTitle>
          <CardDescription>
            {t("view-the-status-of-your-uploaded-documents")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partner.documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("no-documents-uploaded-yet")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {partner.documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium capitalize truncate">
                        {doc.type.replace("_", " ")}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("uploaded")}:{" "}
                        {new Date(doc.uploadedAt).toLocaleDateString()} •{" "}
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </p>
                      {doc.status === "rejected" && doc.rejectionReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {t("reason")}: {doc.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PartnerAccountStatusBadge status={doc.status} t={t} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = doc.fileData;
                        link.download = doc.fileName;
                        link.click();
                      }}
                    >
                      {t("download")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
  );
}
