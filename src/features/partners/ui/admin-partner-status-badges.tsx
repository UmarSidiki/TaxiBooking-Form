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
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          <CheckCircle2 className="w-3 h-3" />
          {t("approved")}
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
          <XCircle className="w-3 h-3" />
          {t("rejected")}
        </span>
      );
    case "suspended":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <XCircle className="w-3 h-3" />
          {t("suspended")}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
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
        <span className="text-xs text-green-600 dark:text-green-400">
          ✓ {t("approved")}
        </span>
      );
    case "rejected":
      return (
        <span className="text-xs text-red-600 dark:text-red-400">
          ✕ {t("rejected")}
        </span>
      );
    default:
      return (
        <span className="text-xs text-yellow-600 dark:text-yellow-400">
          ⏱ {t("pending")}
        </span>
      );
  }
}
