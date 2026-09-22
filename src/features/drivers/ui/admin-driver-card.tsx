"use client";

import type { IDriver } from "@/features/drivers/model";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { CheckCircle, Edit, Trash2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function AdminDriverCard({
  driver,
  onEdit,
  onDelete,
}: {
  driver: IDriver;
  onEdit: (driver: IDriver) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations();

  return (
    <Card className={`desk-card border-border ${driver.isActive ? "" : "opacity-60"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base text-foreground">
              {driver.name}
            </CardTitle>
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
              onClick={() => onDelete(driver._id!)}
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
        <Badge variant={driver.isActive ? "default" : "secondary"}>
          {driver.isActive ? (
            <>
              <CheckCircle className="me-1 size-3" aria-hidden="true" />
              {t("Driver.active")}
            </>
          ) : (
            <>
              <XCircle className="me-1 size-3" aria-hidden="true" />
              {t("Driver.inactive")}
            </>
          )}
        </Badge>
      </CardContent>
    </Card>
  );
}
