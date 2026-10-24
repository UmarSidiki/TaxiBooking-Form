"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, XCircle } from "lucide-react";

import type { DriverStatus } from "@/features/drivers/model";
import { driverStatusLabel } from "@/features/drivers/lib/driver-document-label";
import { Badge } from "@/shared/ui/badge";

export function AdminDriverStatus({
  status,
  isActive,
}: {
  status: DriverStatus;
  isActive: boolean;
}) {
  const t = useTranslations("Driver");

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={status === "approved" ? "default" : "secondary"}>
        {driverStatusLabel(t, status)}
      </Badge>
      {status === "approved" ? (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? (
            <CheckCircle className="me-1 size-3" aria-hidden="true" />
          ) : (
            <XCircle className="me-1 size-3" aria-hidden="true" />
          )}
          {isActive ? t("active") : t("turned-off")}
        </Badge>
      ) : null}
    </div>
  );
}
