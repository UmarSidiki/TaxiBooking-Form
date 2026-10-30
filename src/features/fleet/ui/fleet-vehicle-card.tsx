"use client";

import type { IVehicle } from "@/features/fleet/model";
import { StatusMark } from "@/features/dashboard/ui/riviera/status-mark";
import { Button } from "@/shared/ui/button";
import {
  CheckCircle,
  Edit2,
  Package,
  Trash2,
  Users,
  XCircle,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { VehicleArt, vehicleKindFromVehicle } from "@/shared/ui/riviera/vehicle-art";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/shared/context/currency-context";

const CATEGORY_COLORS: Record<string, string> = {
  economy: "bg-sky-500/20 text-sky-700 dark:text-sky-300",
  comfort: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  business: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300",
  van: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  luxury: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  suv: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
};

export function FleetVehicleCard({
  vehicle,
  onEdit,
  onDelete,
  resolveImageSrc,
}: {
  vehicle: IVehicle;
  onEdit: (vehicle: IVehicle) => void;
  onDelete: (id: string) => void;
  resolveImageSrc: (src: string) => string;
}) {
  const t = useTranslations();
  const { currencySymbol } = useCurrency();
  const [imgFailed, setImgFailed] = useState(false);
  const tierCount = vehicle.priceTiers?.length ?? 0;
  const kind = vehicleKindFromVehicle(vehicle);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded bg-[var(--sheet)] border border-[var(--rule)] ${!vehicle.isActive ? "opacity-60 grayscale" : ""}`}
      aria-label={vehicle.name}
    >
      {/* ── Photo area ────────────────────────────────── */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted/60">
        {vehicle.image && !imgFailed ? (
          <Image
            src={resolveImageSrc(vehicle.image)}
            alt={vehicle.name}
            fill
            unoptimized
            className="object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--well)]">
            <VehicleArt kind={kind} style={{ height: 80 }} />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-base font-semibold text-[var(--ink)] leading-tight mb-1.5 truncate">
            {vehicle.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--ink2)] uppercase tracking-wider">{vehicle.category}</span>
            <StatusMark tone={vehicle.isActive ? "ok" : "err"} label={vehicle.isActive ? t("Dashboard.Fleet.active") : t("Dashboard.Fleet.inactive")} />
          </div>
        </div>

        {/* Top-right: action buttons — always visible on touch, hover-reveal on sm+ pointer devices */}
        <div className="absolute top-3 right-3 flex gap-1.5 sm:opacity-0 sm:translate-y-[-4px] sm:transition-all sm:duration-200 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-focus-within:opacity-100 sm:group-focus-within:translate-y-0">
          <Button
            size="icon"
            variant="secondary"
            onClick={() => onEdit(vehicle)}
            className="size-9 rounded-xl bg-white/90 text-foreground backdrop-blur-sm shadow-md hover:bg-white transition-all duration-150"
            aria-label={`${t("Dashboard.Fleet.edit-vehicle")}: ${vehicle.name}`}
            id={`edit-vehicle-${vehicle._id}`}
          >
            <Edit2 className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            onClick={() => onDelete(vehicle._id!)}
            className="size-9 rounded-xl bg-destructive/90 text-white backdrop-blur-sm shadow-md hover:bg-destructive transition-all duration-150"
            aria-label={`${t("FormBuilder.ui.delete")}: ${vehicle.name}`}
            id={`delete-vehicle-${vehicle._id}`}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-border/50">
        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
          {vehicle.description}
        </p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {/* Persons */}
          <div className="flex items-center gap-1.5">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
              <Users className="size-3 text-muted-foreground" aria-hidden="true" />
            </div>
            <span className="text-xs text-foreground font-medium">
              {vehicle.persons} {t("Dashboard.Fleet.seats")}
            </span>
          </div>

          {/* Bags */}
          <div className="flex items-center gap-1.5">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
              <Package className="size-3 text-muted-foreground" aria-hidden="true" />
            </div>
            <span className="text-xs text-foreground font-medium">
              {vehicle.baggages ?? 0} {t("Dashboard.Fleet.bags")}
            </span>
          </div>

          {/* Base price */}
          <div className="flex items-center gap-1.5">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent/60">
              <span className="text-[9px] font-bold text-accent-foreground">{currencySymbol}</span>
            </div>
            <span className="text-xs text-foreground font-medium">
              {currencySymbol}{vehicle.price.toFixed(2)}
            </span>
          </div>

          {/* Per-km or tier count */}
          {tierCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent/60">
                <Layers className="size-3 text-accent-foreground" aria-hidden="true" />
              </div>
              <span className="text-xs text-foreground font-medium">
                {tierCount} {t("Dashboard.Fleet.tiers")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent/60">
                <span className="text-[8px] font-bold text-accent-foreground">/km</span>
              </div>
              <span className="text-xs text-foreground font-medium">
                {currencySymbol}{vehicle.pricePerKm.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
