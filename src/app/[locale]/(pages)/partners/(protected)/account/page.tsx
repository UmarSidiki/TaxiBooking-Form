"use client";

import { PartnerAccountBanners } from "@/components/partner-account/partner-account-banners";
import { PartnerAccountDocuments } from "@/components/partner-account/partner-account-documents";
import { PartnerAccountProfile } from "@/components/partner-account/partner-account-profile";
import { PartnerAccountUpload } from "@/components/partner-account/partner-account-upload";
import { usePartnerAccount } from "@/hooks/partners/usePartnerAccount";

export default function PartnerAccountPage() {
  const {
    t,
    partner,
    loading,
    uploading,
    documentType,
    setDocumentType,
    selectedFile,
    setSelectedFile,
    error,
    success,
    fileInputKey,
    hasDocumentsUnderReview,
    handleFileChange,
    handleUpload,
  } = usePartnerAccount();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t("failed-to-load-partner-data")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Status Banner */}
      <PartnerAccountBanners
        t={t}
        partner={partner}
        hasDocumentsUnderReview={hasDocumentsUnderReview}
      />

      {/* Profile Information */}
      <PartnerAccountProfile t={t} partner={partner} />

      {/* Document Upload */}
      <PartnerAccountUpload
        t={t}
        documentType={documentType}
        setDocumentType={setDocumentType}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        error={error}
        success={success}
        fileInputKey={fileInputKey}
        uploading={uploading}
        handleFileChange={handleFileChange}
        handleUpload={handleUpload}
      />

      {/* Uploaded Documents */}
      <PartnerAccountDocuments t={t} partner={partner} />
    </div>
  );
}
