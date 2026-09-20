"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/shared/http/api";
import { resolveVehicleImageSrc } from "@/features/fleet/lib/resolve-vehicle-image-src";
import type { IVehicle } from "@/features/fleet/model";
import type { PartnerFleetData } from "@/features/partners/ui/partner-fleet.types";

export type PartnerFleetConfirm =
  | { kind: "request"; vehicleId: string }
  | { kind: "cancel"; vehicleId: string }
  | { kind: "remove" };

export function usePartnerFleet() {
  const t = useTranslations("Dashboard.Partners.Fleet");
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [partner, setPartner] = useState<PartnerFleetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingVehicleId, setCancellingVehicleId] = useState<string | null>(null);
  const [removingFleet, setRemovingFleet] = useState(false);
  const [confirm, setConfirm] = useState<PartnerFleetConfirm | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const resolveImageSrc = (src: string) =>
    resolveVehicleImageSrc(src, "Invalid vehicle image URL. Falling back to placeholder.");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [vehiclesData, partnerRes] = await Promise.all([
        apiGet<{ success: boolean; data: IVehicle[] }>("/api/vehicles"),
        fetch("/api/partners/profile"),
      ]);
      const partnerData = await partnerRes.json();
      if (vehiclesData.success) setVehicles(vehiclesData.data);
      if (partnerData.success) {
        setPartner(partnerData.partner);
      } else {
        setPartner(null);
        setLoadError(t("failed-to-load-partner-data"));
      }
    } catch {
      setPartner(null);
      setLoadError(t("failed-to-load-partner-data"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const pendingRequests = partner?.fleetRequests?.filter((req) => req.status === "pending") || [];
  const approvedRequests = partner?.fleetRequests?.filter((req) => req.status === "approved") || [];

  const requestFleet = async (vehicleId: string) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/partners/fleet/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchData();
        setNotice(t("fleet-request-submitted"));
      } else {
        setNotice(t("fleet-request-failed"));
      }
    } catch {
      setNotice(t("fleet-request-failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFleetRequest = (vehicleId: string) => {
    if (!partner || submitting) return;
    if (pendingRequests.find((req) => req.vehicleId === vehicleId)) {
      setNotice(t("already-requested-this-vehicle"));
      return;
    }
    if (partner.fleetStatus === "approved" || approvedRequests.length > 0) {
      setConfirm({ kind: "request", vehicleId });
      return;
    }
    void requestFleet(vehicleId);
  };

  const cancelRequest = async (vehicleId: string) => {
    setCancellingVehicleId(vehicleId);
    try {
      const response = await fetch("/api/partners/fleet/cancel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await response.json();
      if (response.ok && data.success) await fetchData();
      else setNotice(t("cancel-request-failed"));
    } catch {
      setNotice(t("cancel-request-failed"));
    } finally {
      setCancellingVehicleId(null);
    }
  };

  const removeFleet = async () => {
    setRemovingFleet(true);
    try {
      const response = await fetch("/api/partners/fleet/remove", { method: "DELETE" });
      const data = await response.json();
      if (response.ok && data.success) await fetchData();
      else setNotice(t("remove-fleet-failed"));
    } catch {
      setNotice(t("remove-fleet-failed"));
    } finally {
      setRemovingFleet(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const current = confirm;
    setConfirm(null);
    if (current.kind === "request") await requestFleet(current.vehicleId);
    if (current.kind === "cancel") await cancelRequest(current.vehicleId);
    if (current.kind === "remove") await removeFleet();
  };

  return {
    t,
    vehicles,
    partner,
    isLoading,
    loadError,
    submitting,
    cancellingVehicleId,
    removingFleet,
    resolveImageSrc,
    pendingRequests,
    handleFleetRequest,
    handleCancelRequest: (vehicleId: string) => setConfirm({ kind: "cancel", vehicleId }),
    handleRemoveFleet: () => setConfirm({ kind: "remove" }),
    fetchData,
    confirm,
    setConfirm,
    runConfirm,
    notice,
    setNotice,
  };
}
