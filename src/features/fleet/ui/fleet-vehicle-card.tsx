"use client";

import type { IVehicle } from "@/features/fleet/model";
import { Badge } from "@/shared/ui/badge";
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
  const categoryColor =
    CATEGORY_COLORS[vehicle.category] ??
    "bg-primary/10 text-primary";
  const tierCount = vehicle.priceTiers?.length ?? 0;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border/60 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-8px_oklch(0.22_0.02_260_/_0.18)] focus-within:shadow-[0_12px_40px_-8px_oklch(0.22_0.02_260_/_0.18)] desk-card ${
        !vehicle.isActive ? "opacity-60 grayscale" : ""
      }`}
      aria-label={vehicle.name}
    >
      {/* ── Photo area ────────────────────────────────── */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted/60">
        {vehicle.image ? (
          <Image
            src={resolveImageSrc(vehicle.image)}
            alt={vehicle.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.2"
              stroke="currentColor"
              className="size-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Bottom-left: name + category */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-base font-semibold text-white drop-shadow-sm leading-tight mb-1.5 truncate">
            {vehicle.name}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoryColor} backdrop-blur-sm`}
            >
              {vehicle.category}
            </span>
            {vehicle.isActive ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300">
                <CheckCircle className="size-2.5" aria-hidden="true" />
                {t("Dashboard.Fleet.active")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-300">
                <XCircle className="size-2.5" aria-hidden="true" />
                {t("Dashboard.Fleet.inactive")}
              </span>
            )}
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
