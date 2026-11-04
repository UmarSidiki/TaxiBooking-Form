"use client";

import { useTranslations } from "next-intl";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { Button } from "@/shared/ui/button";
import { CustomerCardList } from "@/features/customers-admin/ui/customer-card-list";
import { CustomersTable } from "@/features/customers-admin/ui/customers-table";
import { CustomersToolbar } from "@/features/customers-admin/ui/customers-toolbar";
import {
  CustomersEmpty,
  CustomersError,
  CustomersSkeleton,
} from "@/features/customers-admin/ui/customers-list-status";
import { useCustomersList } from "@/features/customers-admin/hooks/use-customers-list";

export function CustomersPage() {
  const t = useTranslations("Dashboard.Customers");
  const list = useCustomersList();

  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta
        title={t("title")}
        description={t("description")}
      />

      <CustomersToolbar
        params={list.params}
        searchInput={list.searchInput}
        onSearchChange={list.setSearchInput}
        activeFilterCount={list.activeFilterCount}
        onApplyFilters={list.applyFilters}
        onSortChange={list.setSort}
      />

      <p role="status" aria-live="polite" className="sr-only">
        {list.isLoading
          ? t("loading")
          : t("loaded-count", { count: list.rows.length })}
      </p>

      {list.error ? (
        <CustomersError onRetry={list.reload} />
      ) : list.isLoading ? (
        <CustomersSkeleton />
      ) : list.rows.length === 0 ? (
        <CustomersEmpty hasQuery={list.hasQuery} onReset={list.resetFilters} />
      ) : (
        <>
          <CustomersTable
            rows={list.rows}
            sort={list.params.sort}
            dir={list.params.dir}
            onSort={list.setSort}
          />
          <CustomerCardList rows={list.rows} />

          <div className="flex flex-col items-center gap-2 py-2">
            {list.hasMore ? (
              <Button
                type="button"
                variant="outline"
                onClick={list.loadMore}
                disabled={list.isLoadingMore}
                className="min-h-11 w-full sm:w-auto"
              >
                {list.isLoadingMore ? t("loading-more") : t("load-more")}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">{t("end-of-list")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("loaded-count", { count: list.rows.length })}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
