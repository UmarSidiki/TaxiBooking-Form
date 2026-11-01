"use client";

import { useEffect, useState } from "react";

import { apiGet } from "@/shared/http/api";
import type { MarketingSegment, SegmentCountView } from "@/features/marketing/ui/marketing-ui.types";

type Counts = Partial<Record<"email" | "whatsapp", SegmentCountView>>;

export function useSegmentCounts(segments: MarketingSegment[]) {
  const [counts, setCounts] = useState<Record<string, Counts>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const entries = await Promise.all(
        segments.map(async (segment) => {
          const [email, whatsapp] = await Promise.all([
            apiGet<{ success: true; count: SegmentCountView }>(
              `/api/admin/marketing/segments/${segment.id}/count?channel=email`,
            ).catch(() => null),
            apiGet<{ success: true; count: SegmentCountView }>(
              `/api/admin/marketing/segments/${segment.id}/count?channel=whatsapp`,
            ).catch(() => null),
          ]);
          const row: Counts = {};
          if (email) row.email = email.count;
          if (whatsapp) row.whatsapp = whatsapp.count;
          return [segment.id, row] as const;
        }),
      );
      if (!cancelled) setCounts(Object.fromEntries(entries));
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [segments]);

  return counts;
}
