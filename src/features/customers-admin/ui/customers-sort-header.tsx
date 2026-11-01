"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { TableHead } from "@/shared/ui/table";
import type { CustomerListParams } from "@/features/customers-admin/schema/customer-list.schema";

type SortField = CustomerListParams["sort"];

export function SortableHead({
  field,
  label,
  className,
  sort,
  dir,
  onSort,
}: {
  field: SortField;
  label: string;
  className?: string;
  sort: SortField;
  dir: CustomerListParams["dir"];
  onSort: (sort: SortField, dir: CustomerListParams["dir"]) => void;
}) {
  const active = sort === field;
  return (
    <TableHead
      className={className}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <SortHeader
        field={field}
        label={label}
        active={active}
        dir={dir}
        onSort={onSort}
      />
    </TableHead>
  );
}

function SortHeader({
  field,
  label,
  active,
  dir,
  onSort,
}: {
  field: SortField;
  label: string;
  active: boolean;
  dir: CustomerListParams["dir"];
  onSort: (sort: SortField, dir: CustomerListParams["dir"]) => void;
}) {
  const t = useTranslations("Dashboard.Customers");
  const nextDir =
    active && dir === "asc"
      ? "desc"
      : active
        ? "asc"
        : field === "name" || field === "email"
          ? "asc"
          : "desc";

  return (
    <button
      type="button"
      onClick={() => onSort(field, nextDir)}
      aria-label={t("sort-by", { column: label })}
      className="inline-flex min-h-11 items-center gap-1 rounded text-start font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="size-3.5" aria-hidden="true" />
        ) : (
          <ArrowDown className="size-3.5" aria-hidden="true" />
        )
      ) : null}
    </button>
  );
}
