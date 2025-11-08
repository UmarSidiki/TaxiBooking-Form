"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  Search,
  Filter,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

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

interface Partner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  documents: PartnerDocument[];
  registeredAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export default function AdminPartnersPage() {
  const t = useTranslations("Dashboard.Admin.Partners");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PartnerDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/partners");
      const data = await response.json();

      if (response.ok) {
        setPartners(data.partners);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterPartners = useCallback(() => {
    let filtered = partners;

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPartners(filtered);
  }, [partners, statusFilter, searchQuery]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    filterPartners();
  }, [filterPartners]);

  const handleApprove = async (partnerId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}/approve`, {
        method: "PATCH",
      });

      if (response.ok) {
        fetchPartners();
        setShowDetailsDialog(false);
      }
    } catch (error) {
      console.error("Error approving partner:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPartner || !rejectionReason.trim()) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/partners/${selectedPartner._id}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (response.ok) {
        fetchPartners();
        setShowRejectDialog(false);
        setShowDetailsDialog(false);
        setRejectionReason("");
      }
    } catch (error) {
      console.error("Error rejecting partner:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedPartner || !suspensionReason.trim()) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/partners/${selectedPartner._id}/suspend`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: suspensionReason }),
        }
      );

      if (response.ok) {
        fetchPartners();
        setShowSuspendDialog(false);
        setShowDetailsDialog(false);
        setSuspensionReason("");
      }
    } catch (error) {
      console.error("Error suspending partner:", error);
    } finally {
      setProcessing(false);
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

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="text-xs text-green-600 dark:text-green-400">
            ✓ {t("approved")}
          </span>
        );
      case "rejected":
        return (
          <span className="text-xs text-red-600 dark:text-red-400">
            ✕ {t("rejected")}
          </span>
        );
      default:
        return (
          <span className="text-xs text-yellow-600 dark:text-yellow-400">
            ⏱ {t("pending")}
          </span>
        );
    }
  };

  const stats = {
    total: partners.length,
    pending: partners.filter((p) => p.status === "pending").length,
    approved: partners.filter((p) => p.status === "approved").length,
    rejected: partners.filter((p) => p.status === "rejected").length,
    suspended: partners.filter((p) => p.status === "suspended").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("description")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("total-partners")}
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("pending")}
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("approved")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("rejected")}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("search-placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t("filter-by-status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all-status")}</SelectItem>
                  <SelectItem value="pending">{t("pending")}</SelectItem>
                  <SelectItem value="approved">{t("approved")}</SelectItem>
                  <SelectItem value="rejected">{t("rejected")}</SelectItem>
                  <SelectItem value="suspended">{t("suspended")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("partners-count", { 0: filteredPartners.length })}</CardTitle>
          <CardDescription>
            {t("click-to-view-details")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPartners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("no-partners-found")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPartners.map((partner) => (
                <div
                  key={partner._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedPartner(partner);
                    setShowDetailsDialog(true);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{partner.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {partner.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("registered")}{" "}
                          {new Date(partner.registeredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-muted-foreground">{t("documents")}</p>
                      <p className="text-sm font-medium">
                        {partner.documents.length} {t("uploaded")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(partner.status)}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>{t("partner-details")}</DialogTitle>
            <DialogDescription>
              {t("review-partner-info")}
            </DialogDescription>
          </DialogHeader>

          {selectedPartner && (
            <div className="space-y-6">
              {/* Status */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("status")}
                </p>
                {getStatusBadge(selectedPartner.status)}
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="font-semibold mb-3">{t("personal-information")}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("name")}</p>
                    <p className="font-medium">{selectedPartner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("email")}</p>
                    <p className="font-medium">{selectedPartner.email}</p>
                  </div>
                  {selectedPartner.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("phone")}</p>
                      <p className="font-medium">{selectedPartner.phone}</p>
                    </div>
                  )}
                  {selectedPartner.city && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("city")}</p>
                      <p className="font-medium">{selectedPartner.city}</p>
                    </div>
                  )}
                  {selectedPartner.country && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("country")}</p>
                      <p className="font-medium">{selectedPartner.country}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-3">
                  {t("documents-count", { 0: selectedPartner.documents.length })}
                </h3>
                {selectedPartner.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("no-documents-uploaded")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedPartner.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize truncate">
                              {doc.type.replace("_", " ")}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getDocumentStatusBadge(doc.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowDocumentDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {selectedPartner.status === "rejected" &&
                selectedPartner.rejectionReason && (
                  <div>
                    <h3 className="font-semibold mb-2 text-red-600">
                      {t("rejection-reason")}
                    </h3>
                    <p className="text-sm">{selectedPartner.rejectionReason}</p>
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {selectedPartner?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t("reject")}
                </Button>
                <Button
                  onClick={() => handleApprove(selectedPartner._id)}
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t("approve-partner")}
                    </>
                  )}
                </Button>
              </>
            )}
            {selectedPartner?.status === "approved" && (
              <Button
                variant="destructive"
                onClick={() => setShowSuspendDialog(true)}
                disabled={processing}
                className="w-full sm:w-auto"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {t("suspend-partner")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reject-application")}</DialogTitle>
            <DialogDescription>
              {t("provide-rejection-reason")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder={t("enter-rejection-reason")}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing}
              className="w-full sm:w-auto"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("rejecting")}
                </>
              ) : (
                t("confirm-rejection")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("suspend-account")}</DialogTitle>
            <DialogDescription>
              {t("suspend-warning")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                <strong>{t("warning-label")}</strong> {t("data-deletion-notice")}
              </p>
            </div>
            <Textarea
              placeholder={t("enter-suspension-reason")}
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendDialog(false);
                setSuspensionReason("");
              }}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!suspensionReason.trim() || processing}
              className="w-full sm:w-auto"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("suspending")}
                </>
              ) : (
                t("confirm-suspension")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] w-[95vw] sm:w-full overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg truncate pr-8">
              {t("document-viewer-title", {
                0: selectedDocument?.type.replace("_", " ").toUpperCase() || "",
                1: selectedDocument?.fileName || ""
              })}
            </DialogTitle>
            <DialogDescription>
              {t("file-size", { 0: selectedDocument ? (selectedDocument.fileSize / 1024).toFixed(0) : 0 })}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="border rounded-lg overflow-auto bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                {selectedDocument.mimeType.startsWith("image/") ? (
                  <div className="w-full p-4">
                    <div className="relative w-full h-[70vh] mx-auto">
                      <Image
                        src={selectedDocument.fileData}
                        alt={selectedDocument.fileName}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                ) : selectedDocument.mimeType === "application/pdf" ? (
                  <iframe
                    src={selectedDocument.fileData}
                    className="w-full h-[70vh] min-h-[500px]"
                    title={selectedDocument.fileName}
                  />
                ) : (
                  <div className="text-center p-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {t("preview-not-available")}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = selectedDocument.fileData;
                        link.download = selectedDocument.fileName;
                        link.click();
                      }}
                    >
                      {t("download-file")}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted rounded-lg flex-shrink-0">
                <div>
                  <p className="text-sm font-medium">{t("document-status")}</p>
                  <div className="mt-1">{getDocumentStatusBadge(selectedDocument.status)}</div>
                </div>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = selectedDocument.fileData;
                    link.download = selectedDocument.fileName;
                    link.click();
                  }}
                >
                  {t("download")}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDocumentDialog(false)}
            >
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
