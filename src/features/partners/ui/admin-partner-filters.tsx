"use client";

import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import {
  DeskFilterBar,
  deskControlClassName,
  deskSearchInputClassName,
} from "@/features/dashboard/ui/desk-toolbar";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import { Search, SlidersHorizontal } from "lucide-react";

type AdminPartnersState = ReturnType<typeof useAdminPartners>;

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
    <DeskFilterBar>
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          name="partner-search"
          type="search"
          autoComplete="off"
          aria-label={t("search-placeholder")}
          placeholder={t("search-placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={deskSearchInputClassName}
        />
      </div>
      <div className="hidden shrink-0 items-center text-muted-foreground/50 sm:flex">
        <SlidersHorizontal className="size-3.5" aria-hidden="true" />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger
          className={cn(deskControlClassName, "w-full sm:w-40")}
          aria-label={t("filter-by-status")}
        >
          <SelectValue placeholder={t("filter-by-status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("all-status")}</SelectItem>
          <SelectItem value="pending">{t("pending")}</SelectItem>
          <SelectItem value="approved">{t("approved")}</SelectItem>
          <SelectItem value="rejected">{t("rejected")}</SelectItem>
          <SelectItem value="suspended">{t("suspended")}</SelectItem>
        </SelectContent>
      </Select>
    </DeskFilterBar>
  );
}
