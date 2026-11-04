"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { AuditCardList } from "@/features/customers-admin/ui/audit-card-list";
import { AuditFilters } from "@/features/customers-admin/ui/audit-filters";
import {
  AuditBlocked,
  AuditEmpty,
  AuditLoading,
} from "@/features/customers-admin/ui/audit-page-status";
import { AuditTable } from "@/features/customers-admin/ui/audit-table";
import { useAuditLog } from "@/features/customers-admin/hooks/use-audit-log";

export function AuditPage() {
  const t = useTranslations("Dashboard.AdminAudit");
  const locale = useLocale();
  const audit = useAuditLog();

  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta title={t("title")} description={t("description")} />

      <Link
        href={`/${locale}/dashboard/customers`}
        className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("back")}
      </Link>

      <AuditFilters
        params={audit.params}
        onApply={audit.applyFilters}
        onReset={audit.resetFilters}
      />

      <p role="status" aria-live="polite" className="sr-only">
        {audit.state === "loading" ? t("loading") : t("count", { count: audit.rows.length })}
      </p>

      {audit.state === "error" || audit.state === "forbidden" ? (
        <AuditBlocked
          kind={audit.state}
          onRetry={() => audit.applyFilters({})}
        />
      ) : audit.state === "loading" ? (
        <AuditLoading />
      ) : audit.rows.length === 0 ? (
        <AuditEmpty />
      ) : (
        <>
          <AuditTable rows={audit.rows} />
          <AuditCardList rows={audit.rows} />

          <div className="flex flex-col items-center gap-2 py-2">
            {audit.nextCursor ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
                disabled={audit.loadingMore}
                onClick={() => void audit.loadMore()}
              >
                {audit.loadingMore ? t("loading-more") : t("load-more")}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">{t("end-of-list")}</p>
            )}
            {audit.loadMoreFailed ? (
              <p role="alert" className="text-sm text-destructive">
                {t("load-more-failed")}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {t("count", { count: audit.rows.length })}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
