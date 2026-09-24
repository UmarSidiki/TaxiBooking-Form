"use client";

import type { IPriceTier } from "@/features/fleet/model/Vehicle";
import { applyPriceTiers } from "@/features/fleet/lib/apply-price-tiers";
import { useCurrency } from "@/shared/context/currency-context";
import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";

interface PricePreviewProps {
  price: number;
  pricePerKm: number;
  minimumFare: number;
  priceTiers?: IPriceTier[];
}

const SAMPLE_DISTANCES = [5, 15, 30, 60, 100];

function computeOneWay(
  distanceKm: number,
  price: number,
  pricePerKm: number,
  minimumFare: number,
  priceTiers?: IPriceTier[]
): number {
  const tiered = applyPriceTiers(priceTiers, distanceKm);
  const raw =
    tiered !== undefined ? tiered : price + pricePerKm * distanceKm;
  return Math.max(raw, minimumFare);
}

export function FleetVehicleFormPricePreview({
  price,
  pricePerKm,
  minimumFare,
  priceTiers,
}: PricePreviewProps) {
  const { currencySymbol } = useCurrency();
  const t = useTranslations();
  const hasTiers = (priceTiers?.length ?? 0) > 0;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("Dashboard.Fleet.price-preview")}
        </span>
        {hasTiers && (
          <span className="ms-auto text-[10px] bg-accent text-accent-foreground rounded-full px-2 py-0.5 font-medium">
            {t("Dashboard.Fleet.tier-mode")}
          </span>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {SAMPLE_DISTANCES.map((km) => {
          const fare = computeOneWay(km, price, pricePerKm, minimumFare, priceTiers);
          return (
            <div
              key={km}
              className="flex flex-col items-center gap-1 rounded-lg bg-background/80 border border-border/40 px-2 py-2.5 text-center"
            >
              <span className="text-[10px] text-muted-foreground font-medium">{km} km</span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {currencySymbol}{fare.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground text-center">
        {t("Dashboard.Fleet.preview-one-way")}
      </p>
    </div>
  );
}
