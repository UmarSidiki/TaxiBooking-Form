"use client";

import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { DeskFilterBar, deskSearchInputClassName } from "@/features/dashboard/ui/desk-toolbar";
import { Input } from "@/shared/ui/input";
import { Search } from "lucide-react";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

const TABS = ["applications", "active", "balances", "all"] as const;

export function AdminPartnerFilters({
  t,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}: Pick<
  AdminPartnersState,
  "t" | "searchQuery" | "setSearchQuery" | "statusFilter" | "setStatusFilter"
>) {
  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label={t("filter-by-status")} className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const selected = statusFilter === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`h-11 rounded-md border px-4 text-sm font-medium ${selected ? "border-[var(--ink)] bg-[var(--sig)] text-[var(--sig-on)]" : "border-[var(--rule2)] bg-[var(--sheet)] text-[var(--ink)]"}`}
              onClick={() => setStatusFilter(tab)}
            >
              {t(`tab-${tab}`)}
            </button>
          );
        })}
      </div>
      <DeskFilterBar>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            name="partner-search"
            type="search"
            autoComplete="off"
            aria-label={t("search-placeholder")}
            placeholder={t("search-placeholder")}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className={deskSearchInputClassName}
          />
        </div>
      </DeskFilterBar>
    </div>
  );
}
