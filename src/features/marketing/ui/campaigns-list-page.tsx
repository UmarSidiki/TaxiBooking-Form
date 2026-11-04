"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Megaphone, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { apiGet } from "@/shared/http/api";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { DeskNotice } from "@/features/dashboard/ui/desk-notice";
import type { CampaignView } from "@/features/marketing/lib/campaigns/campaign.repo";
import {
  CampaignChannelLabel,
  CampaignStatusBadge,
  formatCampaignDate,
  statNumber,
} from "@/features/marketing/ui/campaign-format";

export function CampaignsListPage() {
  const t = useTranslations("MarketingCampaigns");
  const locale = useLocale();
  const [rows, setRows] = useState<CampaignView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<{
        success: true;
        campaigns: CampaignView[];
        operator?: { timeZone: string };
      }>("/api/admin/marketing/campaigns");
      setRows(data.campaigns);
      setTimeZone(data.operator?.timeZone);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reportHref = (id: string) =>
    `/${locale}/dashboard/marketing/campaigns/${id}`;
  const newHref = `/${locale}/dashboard/marketing/campaigns/new`;

  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta title={t("title")} description={t("description")} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading ? t("loading") : t("count", { count: rows.length })}
        </p>
        <Button asChild className="min-h-11">
          <Link href={newHref} data-testid="new-campaign">
            <Plus className="size-4" aria-hidden="true" />
            {t("new-campaign")}
          </Link>
        </Button>
      </div>

      {error ? (
        <DeskNotice variant="error" onRetry={() => void load()} retryLabel={t("retry")}>
          {t("load-failed")}
        </DeskNotice>
      ) : loading ? (
        <div
          className="flex flex-col gap-2 rounded border border-border/60 bg-card p-4"
          aria-busy="true"
        >
          <span className="sr-only">{t("loading")}</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded border border-border/60 bg-card p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-md bg-muted">
            <Megaphone className="size-6 text-muted-foreground" aria-hidden="true" />
          </span>
          <div className="flex max-w-md flex-col gap-1">
            <p className="font-medium">{t("empty")}</p>
            <p className="text-sm text-muted-foreground">{t("empty-description")}</p>
          </div>
          <Button asChild variant="outline" className="min-h-11">
            <Link href={newHref}>{t("new-campaign")}</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded border border-border/60 bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("col-name")}</TableHead>
                  <TableHead>{t("col-channel")}</TableHead>
                  <TableHead>{t("col-status")}</TableHead>
                  <TableHead>{t("col-scheduled")}</TableHead>
                  <TableHead className="text-end">{t("col-sent")}</TableHead>
                  <TableHead className="text-end">{t("col-failed")}</TableHead>
                  <TableHead className="text-end">{t("col-skipped")}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t("col-report")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} data-testid="campaign-row">
                    <TableCell className="max-w-64 truncate font-medium">
                      <Link href={reportHref(row.id)} className="hover:underline">
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <CampaignChannelLabel channel={row.channel} />
                    </TableCell>
                    <TableCell>
                      <CampaignStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatCampaignDate(row.scheduledAt, locale, timeZone)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {statNumber(row.stats, "sent")}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {statNumber(row.stats, "failed")}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {statNumber(row.stats, "skipped")}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button asChild variant="ghost" size="sm" className="min-h-11">
                        <Link href={reportHref(row.id)}>
                          {t("view-report")}
                          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={reportHref(row.id)}
                  data-testid="campaign-card"
                  className="flex flex-col gap-3 rounded border border-border/60 bg-card p-4 transition-colors hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words font-medium">{row.name}</p>
                    <CampaignStatusBadge status={row.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <CampaignChannelLabel channel={row.channel} />
                    <span>{formatCampaignDate(row.scheduledAt, locale, timeZone)}</span>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    {(["sent", "failed", "skipped"] as const).map((key) => (
                      <div key={key} className="rounded bg-muted/40 px-2 py-1.5">
                        <dt className="text-xs text-muted-foreground">{t(`col-${key}`)}</dt>
                        <dd className="font-medium tabular-nums">{statNumber(row.stats, key)}</dd>
                      </div>
                    ))}
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
