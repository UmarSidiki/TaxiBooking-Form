"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import type { IVehicle } from "@/features/fleet/model";
import { CheckCircle, Edit, Package, Trash2, Users, XCircle } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function FleetVehicleCard ({
  vehicle,
  onEdit,
  onDelete,
  resolveImageSrc
}: {
  vehicle: IVehicle;
  onEdit: (vehicle: IVehicle) => void;
  onDelete: (id: string) => void;
  resolveImageSrc: (src: string) => string;
}) {
  const t = useTranslations();
  return (
    <Card
      className={`desk-card group min-w-0 border border-border bg-card transition-colors duration-200 hover:border-primary/30 ${
        !vehicle.isActive ? "opacity-60" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate text-foreground">
              {vehicle.name}
            </CardTitle>
            <Badge
              variant="secondary"
              className="mt-1 capitalize bg-primary/10 text-primary hover:bg-primary/20"
            >
              {vehicle.category}
            </Badge>
          </div>
          <div className="flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button
              size="icon"
              variant="outline"
              onClick={() => onEdit(vehicle)}
              className="size-11 hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
              aria-label={`${t("Dashboard.Fleet.edit-vehicle")}: ${vehicle.name}`}
            >
              <Edit className="size-4" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={() => onDelete(vehicle._id!)}
              className="size-11"
              aria-label={`${t("FormBuilder.ui.delete")}: ${vehicle.name}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {vehicle.image && (
          <div className="relative w-full h-40 sm:h-32 bg-muted rounded-lg overflow-hidden">
            <Image
              src={resolveImageSrc(vehicle.image)}
              alt={vehicle.name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2">
          {vehicle.description}
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-foreground">
              {vehicle.persons} {t("Dashboard.Fleet.seats")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-foreground">
              {vehicle.baggages} {t("Dashboard.Fleet.bags")}
            </span>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="flex items-start justify-between gap-3">
          <Badge
            variant={vehicle.isActive ? "default" : "secondary"}
            className={
              vehicle.isActive
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : ""
            }
          >
            {vehicle.isActive ? (
              <>
                <CheckCircle className="me-1 size-3" aria-hidden="true" />
                {t("Dashboard.Fleet.active")}
              </>
            ) : (
              <>
                <XCircle className="me-1 size-3" aria-hidden="true" />
                {t("Dashboard.Fleet.inactive")}
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
