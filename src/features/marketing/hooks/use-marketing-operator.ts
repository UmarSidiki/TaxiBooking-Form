"use client";

import { useEffect, useState } from "react";

import { apiGet } from "@/shared/http/api";
import type { MarketingOperatorSettings } from "@/features/marketing/lib/operator-settings";

/** Operator time zone + WhatsApp cap. `null` until loaded; `error` when the call failed. */
export function useMarketingOperator() {
  const [operator, setOperator] = useState<MarketingOperatorSettings | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    apiGet<{ success: true; operator: MarketingOperatorSettings }>("/api/admin/marketing/operator")
      .then((data) => {
        if (!cancelled) setOperator(data.operator);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { operator, error };
}
