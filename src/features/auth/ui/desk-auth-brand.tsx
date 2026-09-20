"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export function DeskAuthBrand() {
  const t = useTranslations("Auth.Desk");
  const name = process.env.NEXT_PUBLIC_WEBSITE_NAME ?? t("fallback_name");

  return (
    <div className="flex items-center gap-3">
      <div className="relative size-8 overflow-hidden rounded-md bg-sidebar">
        <Image src="/icon.png" alt="" fill className="object-cover" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{t("operations")}</p>
      </div>
    </div>
  );
}
