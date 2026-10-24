"use client";

import type { IDriver } from "@/features/drivers/model";
import { AdminDriverActions } from "@/features/drivers/ui/admin-driver-actions";
import { AdminDriverDocuments } from "@/features/drivers/ui/admin-driver-documents";
import { AdminDriverStatus } from "@/features/drivers/ui/admin-driver-status";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function AdminDriverCard({
  driver,
  pending,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onSetActive,
}: {
  driver: IDriver;
  pending?: boolean;
  onEdit: (driver: IDriver) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSetActive: (id: string, active: boolean) => void;
}) {
  const t = useTranslations();
  const status = driver.status ?? "approved";
  const turnedOff = status === "approved" && !driver.isActive;
  const driverId = driver._id ?? "";

  return (
    <Card className={`desk-card border-border ${turnedOff ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base text-foreground">{driver.name}</CardTitle>
            <p className="truncate text-sm text-muted-foreground">{driver.email}</p>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(driver)}
              className="size-11"
              aria-label={`${t("Driver.edit-driver")}: ${driver.name}`}
            >
              <Edit className="size-4" aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(driverId)}
              className="size-11"
              aria-label={`${t("Driver.delete")}: ${driver.name}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="mb-3" />
        <AdminDriverStatus status={status} isActive={driver.isActive} />
        <AdminDriverDocuments driverId={driverId} documents={driver.documents ?? []} />
        <AdminDriverActions
          status={status}
          isActive={driver.isActive}
          pending={pending}
          onApprove={() => onApprove(driverId)}
          onReject={() => onReject(driverId)}
          onSetActive={(active) => onSetActive(driverId, active)}
        />
      </CardContent>
    </Card>
  );
}
