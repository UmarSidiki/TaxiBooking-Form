"use client";

import { useTranslations } from "next-intl";

import type { DriverStatus } from "@/features/drivers/model";
import { driverStatusLabel } from "@/features/drivers/lib/driver-document-label";
import { StatusMark } from "@/features/dashboard/ui/riviera/status-mark";

export function AdminDriverStatus({
  status,
  isActive,
}: {
  status: DriverStatus;
  isActive: boolean;
}) {
  const t = useTranslations("Driver");

  const statusTone = status === "approved" ? "ok" : status === "rejected" ? "err" : "muted";

  return (
    <div className="flex flex-wrap gap-2">
      <StatusMark tone={statusTone} label={driverStatusLabel(t, status)} />
      {status === "approved" ? (
        <StatusMark tone={isActive ? "ok" : "warn"} label={isActive ? t("active") : t("turned-off")} />
      ) : null}
    </div>
  );
}