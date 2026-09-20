"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/utils/api";
import { resolveVehicleImageSrc } from "@/lib/fleet/resolve-vehicle-image-src";
import type { IVehicle } from "@/models/vehicle";
import type { PartnerFleetData } from "@/components/partner-fleet/partner-fleet.types";

export function usePartnerFleet() {
  const t = useTranslations("Dashboard.Partners.Fleet");
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [partner, setPartner] = useState<PartnerFleetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingVehicleId, setCancellingVehicleId] = useState<string | null>(null);
  const [removingFleet, setRemovingFleet] = useState(false);

  const resolveImageSrc = (src: string) =>
    resolveVehicleImageSrc(
      src,
      "Invalid vehicle image URL. Falling back to placeholder."
    );

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [vehiclesData, partnerData] = await Promise.all([
        apiGet<{ success: boolean; data: IVehicle[] }>("/api/vehicles"),
        fetch("/api/partners/profile").then(res => res.json())
      ]);

      if (vehiclesData.success) {
        setVehicles(vehiclesData.data);
      } else {
        console.error("Failed to fetch vehicles");
      }

      if (partnerData.success) {
        setPartner(partnerData.partner);
      } else {
        console.error("Failed to fetch partner data:", partnerData.error || partnerData);
        setPartner(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setPartner(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingRequests = partner?.fleetRequests?.filter(req => req.status === "pending") || [];
  const approvedRequests = partner?.fleetRequests?.filter(req => req.status === "approved") || [];

  const handleFleetRequest = async (vehicleId: string) => {
    if (!partner || submitting) return;
    
    // Check if already has a pending request for this vehicle
    const existingRequest = pendingRequests.find(req => req.vehicleId === vehicleId);
    if (existingRequest) {
      alert(t("already-requested-this-vehicle"));
      return;
    }
    
    // Show confirmation dialog if partner already has an approved fleet
    if (partner.fleetStatus === "approved" || approvedRequests.length > 0) {
      const confirmed = window.confirm(
        t("confirm-fleet-change-message")
      );
      if (!confirmed) return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch("/api/partners/fleet/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchData(); // Refresh all data
      } else {
        alert(data.message || t("fleet-request-failed"));
      }
    } catch (error) {
      console.error("Error requesting fleet:", error);
      alert(t("fleet-request-failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (vehicleId: string) => {
    if (!partner || cancellingVehicleId) return;
    
    const confirmed = window.confirm(t("confirm-cancel-request"));
    if (!confirmed) return;
    
    setCancellingVehicleId(vehicleId);
    try {
      const response = await fetch("/api/partners/fleet/cancel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchData(); // Refresh all data
      } else {
        alert(data.message || t("cancel-request-failed"));
      }
    } catch (error) {
      console.error("Error cancelling fleet request:", error);
      alert(t("cancel-request-failed"));
    } finally {
      setCancellingVehicleId(null);
    }
  };

  const handleRemoveFleet = async () => {
    if (!partner || removingFleet) return;
    
    const confirmed = window.confirm(t("confirm-remove-fleet"));
    if (!confirmed) return;
    
    setRemovingFleet(true);
    try {
      const response = await fetch("/api/partners/fleet/remove", {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchData(); // Refresh all data
      } else {
        alert(data.message || t("remove-fleet-failed"));
      }
    } catch (error) {
      console.error("Error removing fleet:", error);
      alert(t("remove-fleet-failed"));
    } finally {
      setRemovingFleet(false);
    }
  };

  return {
    t,
    vehicles,
    partner,
    isLoading,
    submitting,
    cancellingVehicleId,
    removingFleet,
    resolveImageSrc,
    pendingRequests,
    approvedRequests,
    handleFleetRequest,
    handleCancelRequest,
    handleRemoveFleet,
  };
}
