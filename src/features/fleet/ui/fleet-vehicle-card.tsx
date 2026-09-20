"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import type { IVehicle } from "@/features/fleet/model";
import { Car, CheckCircle, Edit, Package, Trash2, Users, XCircle } from "lucide-react";
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
      className={`group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20 bg-card min-w-[350px] sm:min-w-[300px] ${
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
          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(vehicle)}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(vehicle._id!)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-3 w-3" />
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
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">
              {vehicle.persons} {t("Dashboard.Fleet.seats")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">
              {vehicle.baggages} {t("Dashboard.Fleet.bags")}
            </span>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
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
                <CheckCircle className="h-3 w-3 mr-1" />
                {t("Dashboard.Fleet.active")}
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                {t("Dashboard.Fleet.inactive")}
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
