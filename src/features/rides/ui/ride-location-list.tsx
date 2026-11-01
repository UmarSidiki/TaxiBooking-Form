"use client";

import { ExternalLink, Navigation } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import {
  formatCoords,
  rideLocationsOf,
  type RideLocation,
  type RideLocationSource,
} from "@/features/rides/lib/ride-locations";

function useLabel() {
  const t = useTranslations("RideLocations");
  return (place: RideLocation) =>
    place.kind === "stop" ? t("stop", { number: place.number ?? 1 }) : t(place.kind);
}

const linkClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Address, precise coordinates and tappable map links for each place on a ride. */
export function RideLocationList({ ride, compact = false }: { ride: RideLocationSource; compact?: boolean }) {
  const t = useTranslations("RideLocations");
  const label = useLabel();
  const places = rideLocationsOf(ride);

  return (
    <ol className={cn("divide-y divide-border rounded-md border border-border", compact ? "text-sm" : "")} data-testid="ride-locations">
      {places.map((place, index) => (
        <li key={`${place.kind}-${index}`} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between" data-testid={`ride-location-${place.kind}`}>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label(place)}</p>
            <p className={cn("break-words text-foreground", compact ? "line-clamp-2" : "")}>{place.address}</p>
            {place.coords ? (
              <p className="font-mono text-xs text-muted-foreground" dir="ltr" data-testid="ride-location-coords">
                {formatCoords(place.coords)}
              </p>
            ) : null}
          </div>
          <div className="-ms-2 flex shrink-0 flex-wrap items-center sm:ms-0">
            <a className={linkClass} href={place.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={`${t("open")}: ${label(place)}`}>
              <ExternalLink className="size-4" aria-hidden />
              {t("open")}
            </a>
            <a className={linkClass} href={place.directionsUrl} target="_blank" rel="noopener noreferrer" aria-label={`${t("navigate")}: ${label(place)}`}>
              <Navigation className="size-4" aria-hidden />
              {t("navigate")}
            </a>
          </div>
        </li>
      ))}
    </ol>
  );
}
