"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { useAdminPartners } from "@/features/partners/hooks/useAdminPartners";
import { Filter, Search } from "lucide-react";

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
    <>
      {/* Filters */}
      <Card className="desk-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  name="partner-search"
                  type="search"
                  autoComplete="off"
                  aria-label={t("search-placeholder")}
                  placeholder={t("search-placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 ps-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11">
                  <Filter className="me-2 size-4" aria-hidden="true" />
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
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
