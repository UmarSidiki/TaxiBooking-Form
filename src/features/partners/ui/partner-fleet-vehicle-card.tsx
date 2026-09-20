"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import type { IVehicle } from "@/features/fleet/model";
import { CheckCircle, Clock, Loader2, Package, Users, X } from "lucide-react";
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

  return (
    <Card
      className={cn(
        "desk-card flex flex-col border-border",
        (isRequested || isApproved) && "ring-1 ring-primary/30"
      )}
    >
      <CardHeader>
        <div className="relative mb-4 h-40 w-full overflow-hidden rounded-md bg-muted">
          <Image
            src={resolveImageSrc(vehicle.image)}
            alt={vehicle.name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold">{vehicle.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0 capitalize">
            {vehicle.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {vehicle.description || t("no-description")}
        </p>
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Users className="size-4 text-muted-foreground" />
            <span>
              {vehicle.persons} {t("seats")}
            </span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Package className="size-4 text-muted-foreground" />
            <span>
              {vehicle.baggages} {t("bags")}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {onRequest && !isRequested && !isApproved ? (
          <Button
            onClick={() => onRequest(vehicle._id!)}
            disabled={isSubmitting}
            className="h-11 w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("requesting")}
              </>
            ) : hasApprovedFleet ? (
              t("request-additional-fleet")
            ) : (
              t("request-fleet")
            )}
          </Button>
        ) : null}
        {isRequested ? (
          <div className="flex w-full gap-2">
            <Badge variant="outline" className="h-11 flex-1 justify-center gap-2">
              <Clock className="size-4" />
              {t("requested")}
            </Badge>
            {onCancel ? (
              <Button
                variant="destructive"
                className="h-11 w-11"
                onClick={() => onCancel(vehicle._id!)}
                disabled={isCancelling}
                title={t("cancel-request")}
              >
                {isCancelling ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              </Button>
            ) : null}
          </div>
        ) : null}
        {isApproved ? (
          <div className="flex w-full gap-2">
            <Badge variant="outline" className="h-11 flex-1 justify-center gap-2">
              <CheckCircle className="size-4" />
              {t("currently-assigned")}
            </Badge>
            {onRemove ? (
              <Button
                variant="destructive"
                className="h-11 w-11"
                onClick={onRemove}
                disabled={isRemoving}
                title={t("remove-fleet")}
              >
                {isRemoving ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
}
