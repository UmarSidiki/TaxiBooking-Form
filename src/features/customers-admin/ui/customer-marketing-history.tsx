"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { formatProfileDateTime } from "@/features/customers-admin/ui/customer-profile-format";
import type { MarketingConsentEventRow } from "@/features/marketing/lib/consent/marketing-consent.types";

export function CustomerMarketingHistory({
  history,
  locale,
}: {
  history: MarketingConsentEventRow[];
  locale: string;
}) {
  const t = useTranslations("MarketingAdmin");

  if (history.length === 0) {
    return (
      <p className="rounded border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{t("history-title")}</h3>
      <ul className="divide-y divide-border/60 rounded border border-border/60 bg-card">
        {history.map((event) => {
          const at = formatProfileDateTime(event.at, locale);
          return (
            <li key={event.id} className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-chip">
                  {t(`channel-${event.channel}`)}
                </Badge>
                <span className="font-medium">{t(`status-${event.status}`)}</span>
                <span className="text-muted-foreground">
                  {t(`source-${event.source.replace(/_/g, "-")}`)}
                </span>
                {event.textVersion ? (
                  <span className="text-xs text-muted-foreground" translate="no">
                    v{event.textVersion}
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground">{at ?? "—"}</span>
              {event.reason ? (
                <span className="text-xs text-muted-foreground sm:max-w-64 sm:truncate">
                  {event.reason}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
