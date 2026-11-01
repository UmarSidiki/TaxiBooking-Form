"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { formatProfileDateTime } from "@/features/customers-admin/ui/customer-profile-format";
import type { MarketingSnapshot } from "@/features/marketing/lib/consent/marketing-consent.types";

export function CustomerMarketingChannelCard({
  label,
  state,
  locale,
  hint,
}: {
  label: string;
  state: MarketingSnapshot["email"];
  locale: string;
  hint?: string;
}) {
  const t = useTranslations("MarketingAdmin");
  const since = formatProfileDateTime(state.at, locale);
  return (
    <div className="rounded border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Badge
          variant={state.status === "granted" ? "secondary" : "outline"}
          className="rounded-chip"
        >
          {t(`status-${state.status}`)}
        </Badge>
      </div>
      <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
        <div className="flex gap-1">
          <dt>{t("since")}:</dt>
          <dd>{since ?? t("never")}</dd>
        </div>
        <div className="flex gap-1">
          <dt>{t("source")}:</dt>
          <dd>
            {state.source
              ? t(`source-${state.source.replace(/_/g, "-")}`)
              : t("none")}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt>{t("text-version")}:</dt>
          <dd translate="no">{state.textVersion || t("none")}</dd>
        </div>
      </dl>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
