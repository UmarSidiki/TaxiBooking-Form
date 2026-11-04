"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { CustomerFilterFields } from "@/features/customers-admin/ui/customers-filter-fields";
import {
  DEFAULT_CUSTOMER_LIST_PARAMS,
  type CustomerListParams,
} from "@/features/customers-admin/schema/customer-list.schema";

export function CustomersFilterDrawer({
  open,
  onOpenChange,
  params,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: CustomerListParams;
  onApply: (patch: Partial<CustomerListParams>) => void;
}) {
  const t = useTranslations("Dashboard.Customers");
  const [draft, setDraft] = useState<CustomerListParams>(params);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(params);
    onOpenChange(next);
  };

  const reset = () => {
    onApply({
      ...DEFAULT_CUSTOMER_LIST_PARAMS,
      q: params.q,
      sort: params.sort,
      dir: params.dir,
    });
    onOpenChange(false);
  };

  const apply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle>{t("filter-title")}</SheetTitle>
          <SheetDescription>{t("filter-description")}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <CustomerFilterFields
            draft={draft}
            onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          />
        </div>
        <SheetFooter className="border-t">
          <Button type="button" variant="outline" onClick={reset}>
            {t("reset-filters")}
          </Button>
          <Button type="button" onClick={apply}>
            {t("apply-filters")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
