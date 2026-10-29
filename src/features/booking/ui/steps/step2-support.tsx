"use client";

import { CreditCard, Mail, Phone } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function Step2Support({ t }: { t: TFn }) {
  return (
          <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-[var(--ink2)]" />
              <span>{t("Step2.24-7-support")}</span>
            </div>
            {process.env.NEXT_PUBLIC_SUPPORT_EMAIL ? (
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                  className="inline-flex min-h-11 items-center hover:text-primary"
                >
                  {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                </a>
              </div>
            ) : null}
            {process.env.NEXT_PUBLIC_PHONE_NUMBER ? (
              <div className="flex items-center gap-2 text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER}`}
                  className="inline-flex min-h-11 items-center hover:text-primary"
                >
                  {process.env.NEXT_PUBLIC_PHONE_NUMBER}
                </a>
              </div>
            ) : null}
          </div>
  );
}
