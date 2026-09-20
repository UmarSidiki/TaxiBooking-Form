"use client";

import { PartnerFleetAssigned } from "@/components/partner-fleet/partner-fleet-assigned";
import { PartnerFleetAvailable } from "@/components/partner-fleet/partner-fleet-available";
import { PartnerFleetPending } from "@/components/partner-fleet/partner-fleet-pending";
import {
  getPartnerFleetStatusInfo,
  PartnerFleetStatusAlert,
} from "@/components/partner-fleet/partner-fleet-status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePartnerFleet } from "@/hooks/fleet/usePartnerFleet";
import { AlertCircle } from "lucide-react";

export default function PartnerFleetPage() {
  const {
    t,
    vehicles,
    partner,
    isLoading,
    submitting,
    cancellingVehicleId,
    removingFleet,
    resolveImageSrc,
    pendingRequests,
    handleFleetRequest,
    handleCancelRequest,
    handleRemoveFleet,
  } = usePartnerFleet();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("failed-to-load-partner-data")}</AlertTitle>
        <AlertDescription>
          {t("ensure-logged-in-and-refresh")}
          <Button variant="outline" size="sm" className="ml-4" onClick={() => window.location.reload()}>
            {t("refresh-page")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const canRequestFleet = partner.fleetStatus === "none" || partner.fleetStatus === "rejected" || partner.fleetStatus === "approved" || !!partner.fleetRequests;
  const approvedVehicle = partner.fleetStatus === "approved" ? vehicles.find(v => v._id === partner.requestedFleet) : 
                         partner.currentFleet ? vehicles.find(v => v._id === partner.currentFleet) : null;

  const statusInfo = getPartnerFleetStatusInfo(partner, vehicles, pendingRequests, t);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("fleet-management")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("select-vehicle-from-admin-fleet")}
        </p>
      </div>

      {statusInfo && <PartnerFleetStatusAlert statusInfo={statusInfo} />}

      {approvedVehicle && (
        <PartnerFleetAssigned
          t={t}
          approvedVehicle={approvedVehicle}
          resolveImageSrc={resolveImageSrc}
          handleRemoveFleet={handleRemoveFleet}
          removingFleet={removingFleet}
        />
      )}

      {pendingRequests.length > 0 && (
        <PartnerFleetPending
          t={t}
          pendingRequests={pendingRequests}
          vehicles={vehicles}
          resolveImageSrc={resolveImageSrc}
          approvedVehicle={approvedVehicle}
          handleCancelRequest={handleCancelRequest}
          cancellingVehicleId={cancellingVehicleId}
        />
      )}

      <PartnerFleetAvailable
        t={t}
        vehicles={vehicles}
        approvedVehicle={approvedVehicle}
        pendingRequests={pendingRequests}
        partner={partner}
        canRequestFleet={canRequestFleet}
        handleFleetRequest={handleFleetRequest}
        submitting={submitting}
        resolveImageSrc={resolveImageSrc}
      />
    </div>
  );
}
