"use client";

import { PartnerAccountBanners } from "@/features/partners/ui/partner-account-banners";
import { PartnerAccountDocuments } from "@/features/partners/ui/partner-account-documents";
import { PartnerAccountProfile } from "@/features/partners/ui/partner-account-profile";
import { PartnerAccountUpload } from "@/features/partners/ui/partner-account-upload";
import { usePartnerAccount } from "@/features/partners/hooks/usePartnerAccount";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";

export default function PartnerAccountPage() {
  const account = usePartnerAccount();
  const { t, partner, loading, error } = account;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mb-4 size-8 animate-spin text-primary" />
        <p className="text-sm">{t("loading")}…</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="alert">
        {error || t("failed-to-load-partner-data")}
        <Button variant="outline" className="ms-3 h-11" onClick={() => void account.fetchPartnerData()}>
          {t("retry")}
        </Button>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PartnerAccountBanners
        t={t}
        partner={partner}
        hasDocumentsUnderReview={account.hasDocumentsUnderReview}
      />
      <PartnerAccountProfile t={t} partner={partner} />
      <PartnerAccountUpload
        t={t}
        documentType={account.documentType}
        setDocumentType={account.setDocumentType}
        selectedFile={account.selectedFile}
        setSelectedFile={account.setSelectedFile}
        error={account.error}
        success={account.success}
        fileInputKey={account.fileInputKey}
        uploading={account.uploading}
        handleFileChange={account.handleFileChange}
        handleUpload={account.handleUpload}
      />
      <PartnerAccountDocuments t={t} partner={partner} />
    </div>
  );
}
