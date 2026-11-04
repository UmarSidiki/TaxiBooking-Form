"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";

const STATUS_TONE: Record<string, string> = {
  draft: "border-border bg-muted/50 text-muted-foreground",
  scheduled: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  sending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  paused: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "border-destructive/30 bg-destructive/5 text-destructive",
};

const KNOWN_STATUSES = new Set(Object.keys(STATUS_TONE));

export function CampaignStatusBadge({ status }: { status: string }) {
  const t = useTranslations("MarketingCampaigns");
  const known = KNOWN_STATUSES.has(status);
  return (
    <Badge
      variant="outline"
      data-status={status}
      className={cn("rounded-chip font-medium", STATUS_TONE[status] ?? STATUS_TONE.draft)}
    >
      {known ? t(`status-${status}` as "status-draft") : status}
    </Badge>
  );
}

export function CampaignChannelLabel({ channel }: { channel: MarketingChannel | string }) {
  const t = useTranslations("MarketingCampaigns");
  const Icon = channel === "whatsapp" ? MessageCircle : Mail;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      {channel === "whatsapp" ? t("channel-whatsapp") : t("channel-email")}
    </span>
  );
}

export function statNumber(stats: Record<string, unknown> | undefined, key: string) {
  const value = stats?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function formatCampaignDate(
  value: string | null | undefined,
  locale: string,
  timeZone?: string,
) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}
