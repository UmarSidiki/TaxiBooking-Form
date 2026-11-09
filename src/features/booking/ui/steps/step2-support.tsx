"use client";

import { CreditCard, Mail, Phone } from "lucide-react";
import type { useTranslations } from "next-intl";

import { useTheme } from "@/features/settings/context/theme-context";

type TFn = ReturnType<typeof useTranslations>;

export function Step2Support({ t }: { t: TFn }) {
  const { settings } = useTheme();
  const email = settings?.adminEmail?.trim();
  const phone = settings?.companyPhone?.trim();
  return (
          <div className="border-t pt-3 text-xs">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-[color:var(--ink2)]" />
              <span>{t("Step2.24-7-support")}</span>
            </div>
            {email ? (
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${email}`}
                  className="inline-flex min-h-9 items-center hover:text-primary"
                >
                  {email}
                </a>
              </div>
            ) : null}
            {phone ? (
              <div className="flex items-center gap-2 text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex min-h-9 items-center hover:text-primary"
                >
                  {phone}
                </a>
              </div>
            ) : null}
          </div>
  );
}
