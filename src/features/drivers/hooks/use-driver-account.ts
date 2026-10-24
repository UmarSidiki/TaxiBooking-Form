"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";

import { PARTNER_DOCUMENT_MIME_TYPES } from "@/features/partners/lib/partner-document-mime-types";

type DriverDocument = {
  type: string;
  fileName: string;
  status: string;
  uploadedAt: string;
};

const ALLOWED = new Set<string>(PARTNER_DOCUMENT_MIME_TYPES);

export function useDriverAccount() {
  const t = useTranslations("Driver");
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [status, setStatus] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState("license");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/drivers/me");
      const data = await response.json();
      if (!response.ok) {
        setError(t("upload-failed"));
        return;
      }
      setDocuments(data.data.documents ?? []);
      setStatus(data.data.status ?? "approved");
      setError(null);
    } catch {
      setError(t("upload-failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!ALLOWED.has(next.type)) {
      setError(t("file-type"));
      return;
    }
    setFile(next);
    setError(null);
  };

  const upload = () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch("/api/drivers/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: documentType,
            fileName: file.name,
            fileData: reader.result,
            mimeType: file.type === "image/jpg" ? "image/jpeg" : file.type,
            fileSize: file.size,
          }),
        });
        if (!response.ok) {
          setError(t("upload-failed"));
          return;
        }
        setFile(null);
        setFileKey((key) => key + 1);
        await load();
      } catch {
        setError(t("upload-failed"));
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError(t("upload-failed"));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return {
    t,
    documents,
    status,
    loading,
    uploading,
    documentType,
    setDocumentType,
    file,
    fileKey,
    error,
    onFile,
    upload,
  };
}
