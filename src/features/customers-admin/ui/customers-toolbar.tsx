"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CustomersFilterDrawer } from "@/features/customers-admin/ui/customers-filter-drawer";
import type { CustomerListParams } from "@/features/customers-admin/schema/customer-list.schema";

export function CustomersToolbar({
  params,
  searchInput,
  onSearchChange,
  activeFilterCount,
  onApplyFilters,
  onSortChange,
}: {
  params: CustomerListParams;
  searchInput: string;
  onSearchChange: (value: string) => void;
  activeFilterCount: number;
  onApplyFilters: (patch: Partial<CustomerListParams>) => void;
  onSortChange: (
    sort: CustomerListParams["sort"],
    dir: CustomerListParams["dir"],
  ) => void;
}) {
  const t = useTranslations("Dashboard.Customers");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const nextDirection = params.dir === "asc" ? "desc" : "asc";

  return (
    <div className="desk-card flex flex-col gap-3 rounded border border-border/60 bg-card p-4 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          autoComplete="off"
          aria-label={t("search-label")}
          placeholder={t("search-placeholder")}
          value={searchInput}
          onChange={(event) => onSearchChange(event.target.value)}
          className="ps-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 gap-2 sm:flex-none"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t("filters")}
          {activeFilterCount > 0 ? (
            <Badge variant="secondary" className="rounded-chip">
              {activeFilterCount}
            </Badge>
          ) : null}
        </Button>

        <Select
          value={params.sort}
          onValueChange={(value) =>
            onSortChange(value as CustomerListParams["sort"], params.dir)
          }
        >
          <SelectTrigger
            className="h-11 min-w-40"
            aria-label={t("sort")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-ride">{t("sort-last-ride")}</SelectItem>
            <SelectItem value="name">{t("sort-name")}</SelectItem>
            <SelectItem value="rides">{t("sort-rides")}</SelectItem>
            <SelectItem value="spend">{t("sort-spend")}</SelectItem>
            <SelectItem value="created">{t("sort-created")}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          onClick={() => onSortChange(params.sort, nextDirection)}
          aria-label={`${t("sort-direction")}: ${
            nextDirection === "asc" ? t("ascending") : t("descending")
          }`}
          title={
            nextDirection === "asc" ? t("ascending") : t("descending")
          }
        >
          {nextDirection === "asc" ? (
            <ArrowUp className="size-4" aria-hidden="true" />
          ) : (
            <ArrowDown className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      <CustomersFilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        params={params}
        onApply={onApplyFilters}
      />
    </div>
  );
}
