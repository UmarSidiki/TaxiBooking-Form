"use client";

import { useCurrency } from "@/shared/context/currency-context";
import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";

export function useAdminPartnerFormat() {
  const t = useTranslations("Dashboard.Admin.Partners");
  const locale = useLocale();
  const { currency } = useCurrency();

  const formatCurrency = useCallback(
    (amount?: number) =>
      new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount ?? 0),
    [currency, locale]
  );

  const formatDate = useCallback(
    (value?: string | null) => {
      if (!value) return t("never-paid");
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return t("never-paid");
      return parsed.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
    [locale, t]
  );

  return { formatCurrency, formatDate };
}
