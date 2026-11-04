"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import {
  toCustomerListSearchString,
  type CustomerListParams,
} from "@/features/customers-admin/schema/customer-list.schema";

/**
 * Plain link so the browser owns the download and the response can stream.
 * The server re-checks the role; non-admins get 403 instead of a file.
 */
export function CustomersExportButton({
  params,
}: {
  params: CustomerListParams;
}) {
  const t = useTranslations("Dashboard.Customers");
  const search = toCustomerListSearchString({
    ...params,
    cursor: undefined,
  });
  const href = `/api/admin/customers/export${search ? `?${search}` : ""}`;

  return (
    <Button
      asChild
      variant="outline"
      className="h-11 flex-1 gap-2 sm:flex-none"
    >
      <a href={href} download aria-label={t("export-aria")}>
        <Download className="size-4" aria-hidden="true" />
        {t("export-csv")}
      </a>
    </Button>
  );
}
