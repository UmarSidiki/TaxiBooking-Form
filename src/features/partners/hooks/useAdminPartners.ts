"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { Partner, PartnerDocument, Vehicle } from "@/features/partners/ui/admin-partner.types";
import { useAdminPartnerFormat } from "@/features/partners/hooks/use-admin-partner-format";

export function useAdminPartners() {
  const t = useTranslations("Dashboard.Admin.Partners");
  const { formatCurrency, formatDate } = useAdminPartnerFormat();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showFleetRejectDialog, setShowFleetRejectDialog] = useState(false);
  const [showFleetRemoveDialog, setShowFleetRemoveDialog] = useState(false);
  const [showFleetDeleteDialog, setShowFleetDeleteDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PartnerDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [fleetRejectionReason, setFleetRejectionReason] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [payoutProcessingId, setPayoutProcessingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [partnersResponse, vehiclesResponse] = await Promise.all([
        fetch("/api/admin/partners"),
        fetch("/api/vehicles")
      ]);
      
      const partnersData = await partnersResponse.json();
      const vehiclesData = await vehiclesResponse.json();

      if (partnersResponse.ok) {
        setPartners(partnersData.partners);
      } else {
        setLoadError(t("load-error"));
      }
      
      if (vehiclesResponse.ok && vehiclesData.success) {
        setVehicles(vehiclesData.data);
      }
    } catch {
      setLoadError(t("load-error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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

  const updatePartnerCollections = useCallback((updated: Partner) => {
    setPartners((prev) =>
      prev.map((partner) => (partner._id === updated._id ? { ...partner, ...updated } : partner))
    );
    setFilteredPartners((prev) =>
      prev.map((partner) => (partner._id === updated._id ? { ...partner, ...updated } : partner))
    );
    setSelectedPartner((prev) =>
      prev && prev._id === updated._id ? { ...prev, ...updated } : prev
    );
  }, []);

  const handleMarkPayoutPaid = useCallback(
    async (partnerId: string) => {
      try {
        setPayoutProcessingId(partnerId);
        const response = await fetch(`/api/admin/partners/${partnerId}/payout`, {
          method: "PATCH",
        });

        const data = await response.json();
        if (!response.ok || !data.success || !data.partner) {
          throw new Error(data.error || "Failed to update payout");
        }

        updatePartnerCollections(data.partner);
      } catch (error) {
        console.error("Failed to mark payout as paid", error);
      } finally {
        setPayoutProcessingId(null);
      }
    },
    [updatePartnerCollections]
  );

  const handleRecalculatePayout = useCallback(
    async (partnerId: string) => {
      try {
        setPayoutProcessingId(partnerId);
        const response = await fetch(`/api/admin/partners/${partnerId}/recalculate-payout`, {
          method: "POST",
        });

        const data = await response.json();
        if (!response.ok || !data.success || !data.partner) {
          throw new Error(data.error || "Failed to recalculate payout");
        }

        updatePartnerCollections(data.partner);
        setNotice(t("payout_recalculated"));
      } catch (error) {
        console.error("Failed to recalculate payout", error);
        setNotice(t("payout_failed"));
      } finally {
        setPayoutProcessingId(null);
      }
    },
    [updatePartnerCollections, t]
  );

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

  const handleFleetApprove = async (partnerId: string, vehicleId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}/fleet/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });

      if (response.ok) {
        fetchPartners();
        setShowDetailsDialog(false);
      }
    } catch (error) {
      console.error("Error approving fleet:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleFleetReject = async (vehicleId: string) => {
    if (!selectedPartner || !fleetRejectionReason.trim()) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/partners/${selectedPartner._id}/fleet/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: fleetRejectionReason, vehicleId }),
        }
      );

      if (response.ok) {
        fetchPartners();
        setShowFleetRejectDialog(false);
        setShowDetailsDialog(false);
        setFleetRejectionReason("");
        setSelectedVehicleId(null);
      }
    } catch (error) {
      console.error("Error rejecting fleet:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleFleetRemove = async (vehicleId: string) => {
    if (!selectedPartner) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/partners/${selectedPartner._id}/fleet/remove`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId }),
        }
      );

      if (response.ok) {
        fetchPartners();
        setShowFleetRemoveDialog(false);
        setShowDetailsDialog(false);
        setSelectedVehicleId(null);
      }
    } catch (error) {
      console.error("Error removing fleet:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleFleetDelete = async () => {
    if (!selectedPartner || !selectedVehicleId) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/partners/${selectedPartner._id}/fleet/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId: selectedVehicleId }),
        }
      );

      if (response.ok) {
        fetchPartners();
        setShowFleetDeleteDialog(false);
        setShowDetailsDialog(false);
        setSelectedVehicleId(null);
      }
    } catch (error) {
      console.error("Error deleting fleet request:", error);
    } finally {
      setProcessing(false);
    }
  };

  const stats = {
    total: partners.length,
    pending: partners.filter((p) => p.status === "pending").length,
    approved: partners.filter((p) => p.status === "approved").length,
    rejected: partners.filter((p) => p.status === "rejected").length,
    suspended: partners.filter((p) => p.status === "suspended").length,
  };

  return {
    t,
    partners,
    filteredPartners,
    vehicles,
    loading,
    selectedPartner,
    setSelectedPartner,
    showDetailsDialog,
    setShowDetailsDialog,
    showRejectDialog,
    setShowRejectDialog,
    showSuspendDialog,
    setShowSuspendDialog,
    showDocumentDialog,
    setShowDocumentDialog,
    showFleetRejectDialog,
    setShowFleetRejectDialog,
    showFleetRemoveDialog,
    setShowFleetRemoveDialog,
    showFleetDeleteDialog,
    setShowFleetDeleteDialog,
    selectedDocument,
    setSelectedDocument,
    rejectionReason,
    setRejectionReason,
    suspensionReason,
    setSuspensionReason,
    fleetRejectionReason,
    setFleetRejectionReason,
    selectedVehicleId,
    setSelectedVehicleId,
    processing,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    payoutProcessingId,
    fetchPartners,
    formatCurrency,
    formatDate,
    handleMarkPayoutPaid,
    handleRecalculatePayout,
    handleApprove,
    handleReject,
    handleSuspend,
    handleFleetApprove,
    handleFleetReject,
    handleFleetRemove,
    handleFleetDelete,
    stats,
    notice,
    setNotice,
    loadError,
  };
}
