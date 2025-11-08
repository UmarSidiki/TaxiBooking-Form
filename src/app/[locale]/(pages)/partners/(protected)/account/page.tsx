"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PartnerDocument {
  type: string;
  fileName: string;
  fileData: string;
  mimeType: string;
  fileSize: number;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  rejectionReason?: string;
}

interface PartnerData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  documents: PartnerDocument[];
  rejectionReason?: string;
  registeredAt: string;
}

export default function PartnerAccountPage() {
  const t = useTranslations("Dashboard.Partners.Dashboard");
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if documents are under review
  const hasDocumentsUnderReview =
    partner?.documents && partner.documents.some((doc) => doc.status === "pending");

  useEffect(() => {
    fetchPartnerData();
  }, []);

  const fetchPartnerData = async () => {
    try {
      const response = await fetch("/api/partners/profile");
      const data = await response.json();

      if (response.ok) {
        setPartner(data.partner);
      } else {
        setError(data.error || "Failed to fetch partner data");
      }
    } catch (error) {
      console.error("Error fetching partner data:", error);
      setError("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (1MB max)
      if (file.size > 1 * 1024 * 1024) {
        setError(t("file-size-must-be-less-than-1mb"));
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <CheckCircle2 className="w-3 h-3" />
            {t("approved")}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
            <XCircle className="w-3 h-3" />
            {t("rejected")}
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <XCircle className="w-3 h-3" />
            {t("suspended")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="w-3 h-3" />
            {t("pending")}
          </span>
        );
    }
  };

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
      {partner.status === "pending" && hasDocumentsUnderReview && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 animate-pulse" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  {t("documents-under-review")}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {t("your-documents-are-currently-being-reviewed")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {partner.status === "pending" && !hasDocumentsUnderReview && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {t("action-required-upload-documents")}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {t("please-upload-all-required-documents")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {partner.status === "rejected" && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  {t("account-rejected")}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {partner.rejectionReason ||
                    t("your-account-has-been-rejected")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {partner.status === "approved" && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  {t("account-approved")}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {t("your-account-has-been-approved")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile-information")}</CardTitle>
          <CardDescription>{t("your-partner-account-details")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("name")}</p>
              <p className="text-base font-semibold">{partner.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("email")}</p>
              <p className="text-base font-semibold">{partner.email}</p>
            </div>
            {partner.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("phone")}
                </p>
                <p className="text-base font-semibold">{partner.phone}</p>
              </div>
            )}
            {partner.city && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("city")}</p>
                <p className="text-base font-semibold">{partner.city}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("account-status")}
              </p>
              <div className="mt-1">{getStatusBadge(partner.status)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
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
                    <SelectItem value="registration">
                      {t("vehicle-registration")}
                    </SelectItem>
                    <SelectItem value="id">{t("id-card")}</SelectItem>
                    <SelectItem value="other">{t("other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("select-file")}</label>
                <Input
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

      {/* Uploaded Documents */}
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium capitalize">
                        {doc.type.replace("_", " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
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
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
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
    </div>
  );
}
