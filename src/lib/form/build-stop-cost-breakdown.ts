import { MINUTES_PER_HOUR } from "@/lib/time/minutes-per-hour";

export type PricedStop = {
  location: string;
  duration?: number;
};

export type StopCostLine = {
  baseCost: number;
  durationCost: number;
  totalCost: number;
  duration: number;
};

export function buildStopCostBreakdown(
  stops: PricedStop[] | undefined,
  stopBasePrice: number,
  stopPricePerHour: number
): {
  validStops: PricedStop[];
  stopCosts: number;
  stopBreakdown: StopCostLine[];
} {
  const validStops = (stops ?? []).filter((stop) => stop.location.trim());
  let stopCosts = 0;
  const stopBreakdown: StopCostLine[] = [];

  for (const stop of validStops) {
    const baseCost = stopBasePrice;
    let durationCost = 0;

    if (stop.duration && stop.duration > 0) {
      durationCost = stopPricePerHour * (stop.duration / MINUTES_PER_HOUR);
    }

    const totalCost = baseCost + durationCost;
    stopCosts += totalCost;
    stopBreakdown.push({
      baseCost,
      durationCost,
      totalCost,
      duration: stop.duration || 0,
    });
  }

  return { validStops, stopCosts, stopBreakdown };
}
