"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { CustomerListParams } from "@/features/customers-admin/schema/customer-list.schema";

export function CustomerFilterNumberFields({
  draft,
  onChange,
}: {
  draft: CustomerListParams;
  onChange: (patch: Partial<CustomerListParams>) => void;
}) {
  const t = useTranslations("Dashboard.Customers");

  const field = (
    key: "ridesMin" | "ridesMax" | "spendMin" | "spendMax",
    labelKey: string,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`customer-${key}`}>{t(labelKey)}</Label>
      <Input
        id={`customer-${key}`}
        type="number"
        min={0}
        inputMode="numeric"
        value={draft[key] === undefined ? "" : String(draft[key])}
        onChange={(event) =>
          onChange({ [key]: numberValue(event.target.value) })
        }
      />
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {field("ridesMin", "rides-min")}
      {field("ridesMax", "rides-max")}
      {field("spendMin", "spend-min")}
      {field("spendMax", "spend-max")}
    </div>
  );
}

function numberValue(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
