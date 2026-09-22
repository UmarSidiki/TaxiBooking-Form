"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { DeskSelect } from "@/features/dashboard/ui/desk-select";
import { whatsappLocales } from "@/features/settings/schema/whatsapp.schema";
import { WhatsAppMessageCard } from "@/features/settings/ui/whatsapp-message-card";
import type { WhatsAppDeskTemplate } from "@/features/settings/ui/whatsapp-desk-types";
import { usePathname, useRouter } from "@/shared/i18n/navigation";

export function WhatsAppTemplates({
  templates,
  companyPhone,
  defaultLocale,
  onChange,
}: {
  templates: WhatsAppDeskTemplate[];
  companyPhone: string;
  defaultLocale: string;
  onChange: () => Promise<void>;
}) {
  const t = useTranslations("Dashboard.Settings");
  const uiLocale = useLocale();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requested = params.get("lang") ?? "";
  const locale = whatsappLocales.includes(requested as (typeof whatsappLocales)[number])
    ? requested
    : defaultLocale;
  const languageNames = useMemo(
    () => new Intl.DisplayNames([uiLocale], { type: "language" }),
    [uiLocale]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-xs">
        <p className="mb-2 text-sm font-medium">{t("whatsapp_template_locale")}</p>
        <DeskSelect
          value={locale}
          ariaLabel={t("whatsapp_template_locale")}
          onValueChange={(value) => router.replace(`${pathname}?lang=${value}`)}
          options={whatsappLocales.map((code) => ({
            value: code,
            label: languageNames.of(code) ?? code,
          }))}
        />
      </div>
      <WhatsAppMessageCard
        templates={templates}
        audience="customer"
        locale={locale}
        companyPhone={companyPhone}
        onChange={onChange}
      />
      <WhatsAppMessageCard
        templates={templates}
        audience="desk"
        locale={locale}
        companyPhone={companyPhone}
        onChange={onChange}
      />
    </div>
  );
}
