"use client";

import { CreditCard, Mail, Phone } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function Step2Support({ t }: { t: TFn }) {
  return (
          <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span>{t("Step2.24-7-support")}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-500" />
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                className="hover:text-primary"
              >
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-500" />
              <a
                href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER}`}
                className="hover:text-primary"
              >
                {process.env.NEXT_PUBLIC_PHONE_NUMBER}
              </a>
            </div>
          </div>
  );
}
