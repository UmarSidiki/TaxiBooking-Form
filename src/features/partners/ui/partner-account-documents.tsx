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
import { useLocale, type useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Dashboard">>;

export function PartnerAccountDocuments({
  t,
  partner,
}: {
  t: TFn;
  partner: PartnerAccountData;
}) {
  const locale = useLocale();

  return (
    <Card className="desk-card border-border">
      <CardHeader>
        <CardTitle>{t("uploaded-documents")}</CardTitle>
        <CardDescription>{t("view-the-status-of-your-uploaded-documents")}</CardDescription>
      </CardHeader>
      <CardContent>
        {partner.documents.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 size-12 opacity-50" />
            <p>{t("no-documents-uploaded-yet")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partner.documents.map((doc) => (
              <div
                key={`${doc.fileName}-${doc.uploadedAt}`}
                className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <FileText className="size-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium capitalize">{doc.type.replace("_", " ")}</p>
                    <p className="truncate text-sm text-muted-foreground">{doc.fileName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("uploaded")}: {new Date(doc.uploadedAt).toLocaleDateString(locale)} •{" "}
                      {(doc.fileSize / 1024).toFixed(0)} KB
                    </p>
                    {doc.status === "rejected" && doc.rejectionReason ? (
                      <p className="mt-1 text-xs text-destructive">
                        {t("reason")}: {doc.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PartnerAccountStatusBadge status={doc.status} t={t} />
                  <Button
                    variant="outline"
                    className="h-11"
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
