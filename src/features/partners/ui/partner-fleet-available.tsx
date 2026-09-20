"use client";

import { PartnerFleetVehicleCard } from "@/features/partners/ui/partner-fleet-vehicle-card";
import type { PartnerFleetData, PartnerFleetRequest } from "@/features/partners/ui/partner-fleet.types";
import type { IVehicle } from "@/features/fleet/model";
import { Car } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Fleet">>;

export function PartnerFleetAvailable({
  t,
  vehicles,
  approvedVehicle,
  pendingRequests,
  partner,
  canRequestFleet,
  handleFleetRequest,
  submitting,
  resolveImageSrc,
}: {
  t: TFn;
  vehicles: IVehicle[];
  approvedVehicle: IVehicle | null | undefined;
  pendingRequests: PartnerFleetRequest[];
  partner: PartnerFleetData;
  canRequestFleet: boolean;
  handleFleetRequest: (vehicleId: string) => void;
  submitting: boolean;
  resolveImageSrc: (src: string) => string;
}) {
  return (
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">{t("available-vehicles")}</h2>
        {vehicles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-semibold">{t("no-vehicles-available")}</p>
            <p className="text-sm">{t("check-back-later")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles
              .filter(v => v._id !== approvedVehicle?._id)
              .map((vehicle) => {
                const hasPendingRequest = pendingRequests.some(req => req.vehicleId === vehicle._id);
                return (
                  <PartnerFleetVehicleCard
                    key={vehicle._id}
                    vehicle={vehicle}
                    onRequest={canRequestFleet && !hasPendingRequest ? handleFleetRequest : undefined}
                    isSubmitting={submitting}
                    resolveImageSrc={resolveImageSrc}
                    isRequested={hasPendingRequest || (partner.requestedFleet === vehicle._id && partner.fleetStatus === "pending")}
                    isApproved={false}
                    hasApprovedFleet={!!approvedVehicle}
                  />
                );
              })}
          </div>
        )}
      </div>
  );
}
