"use client";

import { CustomerFilterNumberFields } from "@/features/customers-admin/ui/customers-filter-number-fields";
import { CustomerFilterSelects } from "@/features/customers-admin/ui/customers-filter-selects";
import type { CustomerListParams } from "@/features/customers-admin/schema/customer-list.schema";

export function CustomerFilterFields({
  draft,
  onChange,
}: {
  draft: CustomerListParams;
  onChange: (patch: Partial<CustomerListParams>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <CustomerFilterNumberFields draft={draft} onChange={onChange} />
      <CustomerFilterSelects draft={draft} onChange={onChange} />
    </div>
  );
}
