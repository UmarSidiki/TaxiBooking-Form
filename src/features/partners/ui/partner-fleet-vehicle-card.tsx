"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import type { IVehicle } from "@/features/fleet/model";
import { CheckCircle, Clock, Package, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function PartnerFleetVehicleCard({
  vehicle,
  onRequest,
  isSubmitting,
  resolveImageSrc,
  isRequested,
  isApproved,
  hasApprovedFleet,
  onCancel,
  isCancelling,
  onRemove,
  isRemoving,
}: {
  vehicle: IVehicle;
  onRequest?: (vehicleId: string) => void;
  isSubmitting: boolean;
  resolveImageSrc: (src: string) => string;
  isRequested: boolean;
  isApproved: boolean;
  hasApprovedFleet?: boolean;
  onCancel?: (vehicleId: string) => void;
  isCancelling?: boolean;
  onRemove?: () => void;
  isRemoving?: boolean;
}) {
  const t = useTranslations("Dashboard.Partners.Fleet");

  const cardClasses = cn(
    "group transition-all duration-300 border-2 flex flex-col",
    isRequested && "border-yellow-400 bg-yellow-50/50 shadow-lg",
    isApproved && "border-green-400 bg-green-50/50 shadow-lg",
    onRequest && !isRequested && !isApproved && "hover:shadow-xl hover:border-primary/50"
  );

  return (
    <Card className={cardClasses}>
      <CardHeader>
        <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden mb-4">
          <Image
            src={resolveImageSrc(vehicle.image)}
            alt={vehicle.name}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-semibold">
              {vehicle.name}
            </CardTitle>
            <Badge variant="secondary" className="capitalize shrink-0 text-white">
              {vehicle.category}
            </Badge>
          </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">
          {vehicle.description || t('no-description')}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
          <div className="flex items-center gap-2 font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{vehicle.persons} {t("seats")}</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{vehicle.baggages} {t("bags")}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {onRequest && !isRequested && !isApproved && (
          <Button
            onClick={() => onRequest(vehicle._id!)}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {t("requesting")}
              </>
            ) : (
              hasApprovedFleet ? t("request-additional-fleet") : t("request-fleet")
            )}
          </Button>
        )}
        {isRequested && (
          <div className="flex gap-2 w-full">
            <Badge variant="outline" className="flex-1 justify-center py-2 bg-yellow-100 text-yellow-800 border-yellow-300">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-semibold">{t("requested")}</span>
            </Badge>
            {onCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(vehicle._id!)}
                disabled={isCancelling}
                className="px-3"
                title={t("cancel-request")}
              >
                {isCancelling ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        )}
        {isApproved && (
          <div className="flex gap-2 w-full">
            <Badge variant="outline" className="flex-1 justify-center py-2 bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="font-semibold">{t("currently-assigned")}</span>
            </Badge>
            {onRemove && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onRemove}
                disabled={isRemoving}
                className="px-3"
                title={t("remove-fleet")}
              >
                {isRemoving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
