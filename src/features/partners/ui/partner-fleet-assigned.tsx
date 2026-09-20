"use client";

import { PartnerFleetVehicleCard } from "@/components/partner-fleet/partner-fleet-vehicle-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { IVehicle } from "@/models/vehicle";
import { Info } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Fleet">>;

export function PartnerFleetAssigned({
  t,
  approvedVehicle,
  resolveImageSrc,
  handleRemoveFleet,
  removingFleet,
}: {
  t: TFn;
  approvedVehicle: IVehicle;
  resolveImageSrc: (src: string) => string;
  handleRemoveFleet: () => void;
  removingFleet: boolean;
}) {
  return (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">{t("currently-assigned")}</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Info className="w-3 h-3 mr-1" />
              {t("can-request-additional-vehicles")}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <PartnerFleetVehicleCard
              vehicle={approvedVehicle}
              isApproved
              isSubmitting={false}
              resolveImageSrc={resolveImageSrc}
              isRequested={false}
              hasApprovedFleet={true}
              onRemove={handleRemoveFleet}
              isRemoving={removingFleet}
            />
          </div>
          <Separator className="my-8" />
        </div>
  );
}
