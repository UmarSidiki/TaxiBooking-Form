"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { useTranslations } from "next-intl";

type TPartners = ReturnType<typeof useTranslations<"Dashboard.Admin.Partners">>;

export function AdminPartnerStatusBadge({
  status,
  t,
}: {
  status: string;
  t: TPartners;
}) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <CheckCircle2 className="w-3 h-3" />
          {t("approved")}
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
          <XCircle className="w-3 h-3" />
          {t("rejected")}
        </span>
      );
    case "suspended":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
          <XCircle className="w-3 h-3" />
          {t("suspended")}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
          <Clock className="w-3 h-3" />
          {t("pending")}
        </span>
      );
  }
}

export function AdminPartnerDocumentStatusBadge({
  status,
  t,
}: {
  status: string;
  t: TPartners;
}) {
  switch (status) {
    case "approved":
      return (
        <span className="text-xs text-primary">
          ✓ {t("approved")}
        </span>
      );
    case "rejected":
      return (
        <span className="text-xs text-destructive">
          ✕ {t("rejected")}
        </span>
      );
    default:
      return (
        <span className="text-xs text-accent-foreground">
          ⏱ {t("pending")}
        </span>
      );
  }
}
