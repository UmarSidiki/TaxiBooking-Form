"use client";

import { PartnerFleetVehicleCard } from "@/features/partners/ui/partner-fleet-vehicle-card";
import type { PartnerFleetRequest } from "@/features/partners/ui/partner-fleet.types";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import type { IVehicle } from "@/features/fleet/model";
import { Clock } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Fleet">>;

export function PartnerFleetPending({
  t,
  pendingRequests,
  vehicles,
  resolveImageSrc,
  approvedVehicle,
  handleCancelRequest,
  cancellingVehicleId,
}: {
  t: TFn;
  pendingRequests: PartnerFleetRequest[];
  vehicles: IVehicle[];
  resolveImageSrc: (src: string) => string;
  approvedVehicle: IVehicle | null | undefined;
  handleCancelRequest: (vehicleId: string) => void;
  cancellingVehicleId: string | null;
}) {
  return (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">{t("pending-requests")}</h2>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Clock className="w-3 h-3 mr-1" />
              {t("awaiting-approval")}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.map((request) => {
              const vehicle = vehicles.find(v => v._id === request.vehicleId);
              if (!vehicle) return null;
              return (
                <PartnerFleetVehicleCard
                  key={vehicle._id}
                  vehicle={vehicle}
                  isRequested
                  isSubmitting={false}
                  resolveImageSrc={resolveImageSrc}
                  isApproved={false}
                  hasApprovedFleet={!!approvedVehicle}
                  onCancel={handleCancelRequest}
                  isCancelling={cancellingVehicleId === vehicle._id}
                />
              );
            })}
          </div>
          <Separator className="my-8" />
        </div>
  );
}
