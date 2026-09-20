"use client";

import { Badge } from "@/shared/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Dashboard">>;

export function PartnerAccountStatusBadge({
  status,
  t,
}: {
  status: string;
  t: TFn;
}) {
  if (status === "approved") {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="size-3" />
        {t("approved")}
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="size-3" />
        {t("rejected")}
      </Badge>
    );
  }
  if (status === "suspended") {
    return (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="size-3" />
        {t("suspended")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="size-3" />
      {t("pending")}
    </Badge>
  );
}
