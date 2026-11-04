"use client";

import type { useTranslations } from "next-intl";
import { StatusMark } from "@/features/dashboard/ui/riviera/status-mark";

type TPartners = ReturnType<typeof useTranslations<"Dashboard.Admin.Partners">>;

export function AdminPartnerStatusBadge({
  status,
  t,
}: {
  status: string;
  t: TPartners;
}) {
  const tone =
    status === "active" || status === "approved"
      ? "ok"
      : status === "rejected"
        ? "err"
        : status === "suspended"
          ? "warn"
          : "info";
  const label =
    status === "active"
      ? t("active")
      : status === "approved"
        ? t("approved")
        : status === "rejected"
          ? t("rejected")
          : status === "suspended"
            ? t("suspended")
            : t("pending");
  return <StatusMark tone={tone} label={label} />;
}

export function AdminPartnerDocumentStatusBadge({
  status,
  t,
}: {
  status: string;
  t: TPartners;
}) {
  const tone =
    status === "active" || status === "approved"
      ? "ok"
      : status === "rejected"
        ? "err"
        : "info";
  const label =
    status === "active" || status === "approved"
      ? t("approved")
      : status === "rejected"
        ? t("rejected")
        : t("pending");
  return <StatusMark tone={tone} label={label} />;
}