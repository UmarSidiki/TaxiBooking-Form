"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { CustomerConsentChips } from "@/features/customers-admin/ui/customer-consent-chips";
import { CustomerPhone } from "@/features/customers-admin/ui/customer-phone";
import { SortableHead } from "@/features/customers-admin/ui/customers-sort-header";
import {
  customerDisplayName,
  formatCustomerCreatedAt,
  formatCustomerMoney,
  formatCustomerRideDate,
} from "@/features/customers-admin/ui/customer-format";
import type { CustomerListRow } from "@/features/customers-admin/lib/customer-list/customer-list.types";
import type { CustomerListParams } from "@/features/customers-admin/schema/customer-list.schema";

type SortField = CustomerListParams["sort"];

export function CustomersTable({
  rows,
  sort,
  dir,
  onSort,
}: {
  rows: CustomerListRow[];
  sort: SortField;
  dir: CustomerListParams["dir"];
  onSort: (sort: SortField, dir: CustomerListParams["dir"]) => void;
}) {
  const t = useTranslations("Dashboard.Customers");
  const locale = useLocale();

  const sortable = (
    field: SortField,
    label: string,
    className?: string,
  ) => (
    <SortableHead
      field={field}
      label={label}
      className={className}
      sort={sort}
      dir={dir}
      onSort={onSort}
    />
  );

  return (
    <div className="hidden overflow-hidden rounded border border-border/60 bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {sortable("name", t("column-name"))}
            {sortable("email", t("column-email"))}
            <TableHead>{t("column-phone")}</TableHead>
            {sortable("rides", t("column-rides"), "text-end")}
            {sortable("spend", t("column-spend"), "text-end")}
            {sortable("last-ride", t("column-last-ride"), "text-end")}
            <TableHead>{t("column-consent")}</TableHead>
            {sortable("created", t("column-created"), "text-end")}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {customerDisplayName(row)}
              </TableCell>
              <TableCell className="max-w-56 truncate text-muted-foreground">
                {row.email}
              </TableCell>
              <TableCell>
                <CustomerPhone row={row} />
              </TableCell>
              <TableCell className="text-end tabular-nums">{row.rides}</TableCell>
              <TableCell className="text-end tabular-nums">
                {formatCustomerMoney(row.spendMinor, row.currency, locale)}
              </TableCell>
              <TableCell className="text-end">
                {formatCustomerRideDate(row.lastRideAt, locale) ??
                  t("never")}
              </TableCell>
              <TableCell>
                <CustomerConsentChips
                  emailConsent={row.emailConsent}
                  whatsappConsent={row.whatsappConsent}
                />
              </TableCell>
              <TableCell className="text-end text-muted-foreground">
                {formatCustomerCreatedAt(row.createdAt, locale) ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
