"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export function TriStateSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: "any" | "yes" | "no";
  onChange: (value: string) => void;
}) {
  const t = useTranslations("Dashboard.Customers");
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">{t("any")}</SelectItem>
          <SelectItem value="yes">{t("yes")}</SelectItem>
          <SelectItem value="no">{t("no")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function ConsentSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: "any" | "granted" | "none";
  onChange: (value: string) => void;
}) {
  const t = useTranslations("Dashboard.Customers");
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">{t("consent-any")}</SelectItem>
          <SelectItem value="granted">{t("consent-granted")}</SelectItem>
          <SelectItem value="none">{t("consent-none")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
