"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PARTNER_DOCUMENT_MIME_TYPES } from "@/features/partners/lib/partner-document-mime-types";
import type { PartnerAccountData } from "@/features/partners/ui/partner-account.types";

export function usePartnerAccount() {
  const t = useTranslations("Dashboard.Partners.Dashboard");
  const [partner, setPartner] = useState<PartnerAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState<number>(0);

  // Check if documents are under review
  const hasDocumentsUnderReview =
    partner?.documents && partner.documents.some((doc) => doc.status === "pending");

  const fetchPartnerData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/partners/profile");
      const data = await response.json();

      if (response.ok) {
        setPartner(data.partner);
      } else {
        setError(t("failed-to-load-partner-data"));
      }
    } catch {
      setError(t("failed-to-load-partner-data"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchPartnerData();
  }, [fetchPartnerData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!PARTNER_DOCUMENT_MIME_TYPES.includes(file.type as (typeof PARTNER_DOCUMENT_MIME_TYPES)[number])) {
        setError(t("only-pdf-jpg-and-png-files-are-allowed"));
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      setError(t("please-select-a-document-type-and-file"));
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const fileData = e.target?.result as string;

          const response = await fetch("/api/partners/upload-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: documentType,
              fileName: selectedFile.name,
              fileData,
              mimeType: selectedFile.type,
              fileSize: selectedFile.size,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            setSuccess(t("document-uploaded-successfully"));
            setSelectedFile(null);
            setDocumentType("");
            setFileInputKey(prev => prev + 1); // Reset file input
            fetchPartnerData();
          } else {
            setError(data.error || t("failed-to-upload-document"));
          }
        } catch (error) {
          console.error("Error uploading partner document:", error);
          setError(t("an-error-occurred-while-uploading"));
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError(t("failed-to-read-file"));
        setUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Error processing partner document:", error);
      setError(t("an-error-occurred-while-processing-the-file"));
      setUploading(false);
    }
  };

  return {
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
    fetchPartnerData,
  };
}
