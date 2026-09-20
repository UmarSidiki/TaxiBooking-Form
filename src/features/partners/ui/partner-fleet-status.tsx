"use client";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import type { PartnerFleetData, PartnerFleetRequest } from "@/features/partners/ui/partner-fleet.types";
import type { IVehicle } from "@/features/fleet/model";
import { AlertCircle, CheckCircle, Clock, Info } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Fleet">>;

export function getPartnerFleetStatusInfo(
  partner: PartnerFleetData | null,
  vehicles: IVehicle[],
  pendingRequests: PartnerFleetRequest[],
  t: TFn
):
  | {
      variant: "default" | "destructive" | "success";
      icon: ReactElement;
      title: string;
      description: string;
    }
  | null {
    if (!partner) return null;

    // Check for multiple pending requests
    if (pendingRequests.length > 0) {
      const requestedVehicles = pendingRequests.map(req => {
        const vehicle = vehicles.find(v => v._id === req.vehicleId);
        return vehicle?.name || 'Unknown Vehicle';
      }).join(', ');
      
      return {
        variant: "default",
        icon: <Clock className="h-4 w-4" />,
        title: t("pending-approval"),
        description: `${t("requested-vehicles")}: ${requestedVehicles}. ${t("waiting-for-admin-approval")}`,
      };
    }

    const requestedVehicle = vehicles.find(v => v._id === partner.requestedFleet);

    switch (partner.fleetStatus) {
      case "pending":
        return {
          variant: "default",
          icon: <Clock className="h-4 w-4" />,
          title: t("pending-approval"),
          description: `${t("requested-vehicle")}: ${requestedVehicle?.name || 'N/A'}. ${t("waiting-for-admin-approval")}`,
        };
      case "approved":
        return {
          variant: "success",
          icon: <CheckCircle className="h-4 w-4" />,
          title: t("approved"),
          description: `${t("you-can-now-accept-rides")} ${t("you-can-request-different-vehicle")}`,
        };
      case "rejected":
        return {
          variant: "destructive",
          icon: <AlertCircle className="h-4 w-4" />,
          title: t("rejected"),
          description: `${t("reason")}: ${partner.fleetRejectionReason || t("no-reason-provided")}. ${t("you-can-request-different-vehicle")}`,
        };
      default:
        return {
          variant: "default",
          icon: <Info className="h-4 w-4" />,
          title: t("no-fleet-assigned"),
          description: t("select-vehicle-to-request"),
        };
    }
}

export function PartnerFleetStatusAlert({
  statusInfo,
}: {
  statusInfo: NonNullable<ReturnType<typeof getPartnerFleetStatusInfo>>;
}) {
  return (
        <Alert variant={statusInfo.variant as "default" | "destructive" | "success"}>
          {statusInfo.icon}
          <AlertTitle>{statusInfo.title}</AlertTitle>
          <AlertDescription>{statusInfo.description}</AlertDescription>
        </Alert>
  );
}
