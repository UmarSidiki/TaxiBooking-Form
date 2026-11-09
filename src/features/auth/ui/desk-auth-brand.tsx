"use client";

import { useTranslations } from "next-intl";

import { DeskMark } from "@/features/auth/ui/desk-mark";
import { useBrandIdentity } from "@/features/settings/ui/brand-logo";

export function DeskAuthBrand() {
  const t = useTranslations("Auth.Desk");
  const { name } = useBrandIdentity(t("fallback_name"));

  return (
    <div className="flex items-center gap-3">
      <DeskMark />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{t("operations")}</p>
      </div>
    </div>
  );
}
