"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, Pause, Play, RefreshCw, SearchX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { cn } from "@/shared/lib/utils";
import { ApiError, apiGet, apiPost } from "@/shared/http/api";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { DeskNotice } from "@/features/dashboard/ui/desk-notice";
import { useMarketingOperator } from "@/features/marketing/hooks/use-marketing-operator";
import type { CampaignView } from "@/features/marketing/lib/campaigns/campaign.repo";
import type {
  CampaignRecipientRow,
  CampaignReportSummary,
} from "@/features/marketing/lib/campaigns/campaign-report-summary";
import {
  CampaignChannelLabel,
  CampaignStatusBadge,
  formatCampaignDate,
} from "@/features/marketing/ui/campaign-format";

type Report = {
  campaign: CampaignView;
  summary: CampaignReportSummary;
};
type Action = "pause" | "resume" | "cancel";
const FILTERS = ["all", "sent", "failed", "skipped", "pending"] as const;
type Filter = (typeof FILTERS)[number];
const PAGE = 50;
const LIVE_STATUSES = new Set(["scheduled", "sending"]);

function bucket(status: string): Exclude<Filter, "all"> {
  if (status === "sent" || status === "failed") return status;
  if (status.startsWith("skipped")) return "skipped";
  return "pending";
}

const RECIPIENT_TONE: Record<Exclude<Filter, "all">, string> = {
  sent: "text-emerald-700 dark:text-emerald-300",
  failed: "text-destructive",
  skipped: "text-muted-foreground",
  pending: "text-amber-700 dark:text-amber-300",
};

export function CampaignReportPage({ id }: { id: string }) {
  const t = useTranslations("MarketingCampaigns");
  const locale = useLocale();
  const [report, setReport] = useState<Report | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<CampaignRecipientRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [rowsState, setRowsState] = useState<"loading" | "ready" | "error" | "more">("loading");
  const [rowsKey, setRowsKey] = useState(0);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionError, setActionError] = useState(false);
  const timeZone = useMarketingOperator().operator?.timeZone;

  const load = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setState("loading");
      try {
        const data = await apiGet<{ success: true } & Report>(
          `/api/admin/marketing/campaigns/${id}/report`,
        );
        setReport({ campaign: data.campaign, summary: data.summary });
        setRowsKey((k) => k + 1);
        setState("ready");
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) setState("missing");
        else if (!quiet) setState("error");
      } finally {
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const live = report ? LIVE_STATUSES.has(report.campaign.status) : false;
  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => void load(true), 15_000);
    return () => window.clearInterval(timer);
  }, [live, load]);

  async function run(action: Action) {
    setPendingAction(action);
    setActionError(false);
    try {
      await apiPost(`/api/admin/marketing/campaigns/${id}/${action}`, {});
      setConfirmCancel(false);
      await load(true);
    } catch {
      setActionError(true);
    } finally {
      setPendingAction(null);
    }
  }

  const fetchRows = useCallback(
    (f: Filter, cursor: string | null) =>
      apiGet<{ success: true; recipients: CampaignRecipientRow[]; nextCursor: string | null }>(
        `/api/admin/marketing/campaigns/${id}/recipients?status=${f}&limit=${PAGE}` +
          (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""),
      ),
    [id],
  );

  useEffect(() => {
    if (rowsKey === 0) return;
    let cancelled = false;
    setRowsState((prev) => (prev === "ready" ? "ready" : "loading"));
    fetchRows(filter, null)
      .then((data) => {
        if (cancelled) return;
        setRows(data.recipients);
        setNextCursor(data.nextCursor);
        setRowsState("ready");
      })
      .catch(() => {
        if (!cancelled) setRowsState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [fetchRows, filter, rowsKey]);

  async function loadMore() {
    if (!nextCursor) return;
    setRowsState("more");
    try {
      const data = await fetchRows(filter, nextCursor);
      setRows((prev) => [...prev, ...data.recipients]);
      setNextCursor(data.nextCursor);
      setRowsState("ready");
    } catch {
      setRowsState("error");
    }
  }

  const listHref = `/${locale}/dashboard/marketing/campaigns`;
  const back = (
    <div>
      <Button asChild variant="ghost" size="sm" className="min-h-11 -ms-2">
        <Link href={listHref}>
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("back-to-list")}
        </Link>
      </Button>
    </div>
  );

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-5" aria-busy="true">
        <DeskPageMeta title={t("report-title")} description={t("report-description")} />
        {back}
        <span className="sr-only">{t("report-loading")}</span>
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (state === "missing" || state === "error" || !report) {
    return (
      <div className="flex flex-col gap-5">
        <DeskPageMeta title={t("report-title")} description={t("report-description")} />
        {back}
        {state === "missing" ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded border border-border/60 bg-card p-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-md bg-muted">
              <SearchX className="size-6 text-muted-foreground" aria-hidden="true" />
            </span>
            <p className="font-medium">{t("report-missing")}</p>
          </div>
        ) : (
          <DeskNotice variant="error" onRetry={() => void load()} retryLabel={t("retry")}>
            {t("report-failed")}
          </DeskNotice>
        )}
      </div>
    );
  }

  const { campaign, summary } = report;
  const processed = summary.sent + summary.failed + summary.skipped;
  const progress = summary.targeted > 0 ? Math.round((processed / summary.targeted) * 100) : 0;
  const canPause = campaign.status === "scheduled" || campaign.status === "sending";
  const canResume = campaign.status === "paused";
  const canCancel = !["done", "cancelled"].includes(campaign.status);
  const isWhatsApp = campaign.channel === "whatsapp";
  const pct = (n: number) =>
    summary.sent > 0 ? `${Math.round((n / summary.sent) * 100)}%` : null;

  const metrics: Array<{ key: string; value: number | null; hint?: string | null; tone?: string }> = [
    { key: "metric-targeted", value: summary.targeted },
    { key: "metric-sent", value: summary.sent, tone: "text-emerald-700 dark:text-emerald-300" },
    { key: "metric-failed", value: summary.failed, tone: summary.failed ? "text-destructive" : undefined },
    { key: "metric-skipped", value: summary.skipped },
    {
      key: isWhatsApp ? "metric-read" : "metric-opened",
      value: isWhatsApp ? null : summary.opened,
      hint: isWhatsApp ? t("metric-read-untracked") : pct(summary.opened),
    },
    { key: "metric-clicked", value: isWhatsApp ? null : summary.clicked, hint: isWhatsApp ? t("metric-read-untracked") : pct(summary.clicked) },
    { key: "metric-unsubscribed", value: summary.unsubscribed, hint: pct(summary.unsubscribed) },
    { key: "metric-bookings", value: summary.bookingsAfter, hint: t("metric-bookings-hint") },
  ];

  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta title={campaign.name} description={t("report-description")} />
      {back}

      <section className="flex flex-col gap-4 rounded border border-border/60 bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 break-words text-xl font-semibold tracking-tight" data-testid="report-name">
                {campaign.name}
              </h2>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{t("field-channel")}</dt>
                <dd><CampaignChannelLabel channel={campaign.channel} /></dd>
              </div>
              <div className="flex gap-1.5">
                <dt>{t("col-scheduled")}:</dt>
                <dd>{formatCampaignDate(campaign.scheduledAt, locale, timeZone)}{timeZone ? ` (${timeZone})` : ""}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>{t("report-created")}:</dt>
                <dd>{formatCampaignDate(campaign.createdAt, locale, timeZone)}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => void load(true)}
              disabled={refreshing}
              aria-label={t("refresh")}
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} aria-hidden="true" />
              <span className="sm:not-sr-only sr-only">{t("refresh")}</span>
            </Button>
            {canPause ? (
              <Button type="button" variant="outline" className="min-h-11" disabled={pendingAction !== null} onClick={() => void run("pause")} data-testid="campaign-pause">
                <Pause className="size-4" aria-hidden="true" />
                {t("action-pause")}
              </Button>
            ) : null}
            {canResume ? (
              <Button type="button" className="min-h-11" disabled={pendingAction !== null} onClick={() => void run("resume")} data-testid="campaign-resume">
                <Play className="size-4" aria-hidden="true" />
                {t("action-resume")}
              </Button>
            ) : null}
            {canCancel ? (
              <Button type="button" variant="destructive" className="min-h-11" disabled={pendingAction !== null} onClick={() => setConfirmCancel(true)} data-testid="campaign-cancel">
                <Ban className="size-4" aria-hidden="true" />
                {t("action-cancel")}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("progress")}</span>
            <span className="tabular-nums">
              {t("progress-value", { done: processed, total: summary.targeted })}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={t("progress")}
          >
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          {live ? <p className="text-xs text-muted-foreground">{t("live-note")}</p> : null}
        </div>

        {actionError ? <DeskNotice variant="error">{t("action-failed")}</DeskNotice> : null}
      </section>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="report-metrics">
        {metrics.map((m) => (
          <div key={m.key} className="flex flex-col gap-1 rounded border border-border/60 bg-card p-3 sm:p-4">
            <dt className="text-xs text-muted-foreground sm:text-sm">{t(m.key)}</dt>
            <dd className={cn("text-2xl font-semibold tabular-nums", m.tone)}>{m.value ?? "—"}</dd>
            {m.hint ? <dd className="text-xs text-muted-foreground">{m.hint}</dd> : null}
          </div>
        ))}
      </dl>
      {!isWhatsApp ? <p className="-mt-2 text-xs text-muted-foreground">{t("tracking-note")}</p> : null}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{t("recipients-title")}</h2>
          <div role="tablist" aria-label={t("recipients-filter")} className="flex gap-1 overflow-x-auto rounded border border-border/60 bg-card p-1">
            {FILTERS.map((f) => {
              const n = f === "all" ? summary.targeted : summary[f];
              return (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => {
                    if (f === filter) return;
                    setFilter(f);
                    setRows([]);
                    setNextCursor(null);
                    setRowsState("loading");
                  }}
                  className={cn(
                    "min-h-11 shrink-0 whitespace-nowrap rounded-chip px-3 text-sm transition-colors",
                    filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {t(`filter-${f}`)} <span className="tabular-nums opacity-80">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {rowsState === "loading" ? (
          <div className="flex flex-col gap-2 rounded border border-border/60 bg-card p-3" aria-busy="true">
            <span className="sr-only">{t("report-loading")}</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rowsState === "error" && rows.length === 0 ? (
          <DeskNotice variant="error" onRetry={() => setRowsKey((k) => k + 1)} retryLabel={t("retry")}>
            {t("report-failed")}
          </DeskNotice>
        ) : rows.length === 0 ? (
          <p className="rounded border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
            {summary.targeted === 0 ? t("recipients-none") : t("recipients-filter-empty")}
          </p>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded border border-border/60 bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>{t("col-recipient")}</TableHead>
                    <TableHead>{t("col-status")}</TableHead>
                    <TableHead>{t("col-sent-at")}</TableHead>
                    <TableHead>{t("col-error")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} data-testid="recipient-row">
                      <TableCell className="max-w-72 truncate" dir="ltr">{r.email}</TableCell>
                      <TableCell className={RECIPIENT_TONE[bucket(r.status)]}>{t(`recipient-${r.status}`)}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatCampaignDate(r.sentAt, locale, timeZone)}</TableCell>
                      <TableCell className="max-w-80 truncate text-muted-foreground" title={r.error || undefined}>{r.error || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="flex flex-col divide-y divide-border/60 rounded border border-border/60 bg-card md:hidden">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 break-all" dir="ltr">{r.email}</span>
                    <span className={cn("shrink-0 text-xs font-medium", RECIPIENT_TONE[bucket(r.status)])}>
                      {t(`recipient-${r.status}`)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatCampaignDate(r.sentAt, locale, timeZone)}</span>
                  {r.error ? <span className="break-words text-xs text-destructive">{r.error}</span> : null}
                </li>
              ))}
            </ul>
            {nextCursor ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 self-center"
                disabled={rowsState === "more"}
                onClick={() => void loadMore()}
                data-testid="recipients-more"
              >
                {t("show-more-page", { shown: rows.length })}
              </Button>
            ) : null}
          </>
        )}
      </section>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancel-title")}</DialogTitle>
            <DialogDescription>{t("cancel-description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setConfirmCancel(false)}>
              {t("cancel-keep")}
            </Button>
            <Button type="button" variant="destructive" className="min-h-11" disabled={pendingAction !== null} onClick={() => void run("cancel")} data-testid="campaign-cancel-confirm">
              {t("cancel-confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
