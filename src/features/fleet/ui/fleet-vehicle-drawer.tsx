"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  Info,
  DollarSign,
  Users,
  MapPin,
  Layers,
  Save,
  Loader2,
  X,
} from "lucide-react";

import type { VehicleForm } from "@/features/fleet/ui/vehicle-form.types";
import { FleetVehicleFormBasic } from "@/features/fleet/ui/fleet-vehicle-form-basic";
import { FleetVehicleFormPricing } from "@/features/fleet/ui/fleet-vehicle-form-pricing";
import { FleetVehicleFormCapacity } from "@/features/fleet/ui/fleet-vehicle-form-capacity";
import { FleetVehicleFormStops } from "@/features/fleet/ui/fleet-vehicle-form-stops";
import { FleetVehicleFormTiers } from "@/features/fleet/ui/fleet-vehicle-form-tiers";
import { FleetVehicleFormPricePreview } from "@/features/fleet/ui/fleet-vehicle-form-price-preview";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import type { IPriceTier } from "@/features/fleet/model/Vehicle";

type TabId = "basic" | "pricing" | "capacity" | "stops" | "tiers";

const TABS: {
  id: TabId;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}[] = [
  { id: "basic", icon: Info, labelKey: "tab-basic" },
  { id: "pricing", icon: DollarSign, labelKey: "tab-pricing" },
  { id: "capacity", icon: Users, labelKey: "tab-capacity" },
  { id: "stops", icon: MapPin, labelKey: "tab-stops" },
  { id: "tiers", icon: Layers, labelKey: "tab-tiers" },
];

interface FleetVehicleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: VehicleForm;
  setFormData: (data: VehicleForm) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  editingId: string | null;
}

export function FleetVehicleDrawer({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  editingId,
}: FleetVehicleDrawerProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<TabId>("basic");

  const showPreview = activeTab === "pricing" || activeTab === "tiers";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-[54rem] overflow-hidden [&>button]:hidden"
      >
        {/* ── Drawer header ─────────────────────────── */}
        <SheetHeader className="flex-none border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-sm font-semibold text-foreground sm:text-base truncate">
                {editingId
                  ? t("Dashboard.Fleet.edit-vehicle")
                  : t("Dashboard.Fleet.add-new-vehicle")}
              </SheetTitle>
              {editingId && (
                <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">
                  {formData.name}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="shrink-0 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("Dashboard.Fleet.cancel")}
              id="fleet-drawer-close"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </SheetHeader>

        {/* ── Body: layout switches on mobile vs desktop ─ */}
        <form
          id="fleet-vehicle-form"
          onSubmit={onSubmit}
          className="flex flex-1 overflow-hidden flex-col sm:flex-row"
        >
          {/* ── Mobile: horizontal tab bar (top) ────────── */}
          <nav
            className="flex sm:hidden w-full shrink-0 flex-row overflow-x-auto border-b border-border/60 bg-muted/30 px-2 py-1.5 gap-1 scrollbar-none"
            aria-label="Form sections"
          >
            {TABS.map(({ id, icon: Icon, labelKey }) => {
              const isActive = activeTab === id;
              const hasTierBadge =
                id === "tiers" && (formData.priceTiers?.length ?? 0) > 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-selected={isActive}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  }`}
                  id={`fleet-tab-mobile-${id}`}
                >
                  <Icon
                    className={`size-3.5 shrink-0 transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{t(`Dashboard.Fleet.${labelKey}`)}</span>
                  {hasTierBadge && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
                      {formData.priceTiers!.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── Desktop: vertical tab sidebar (left) ──── */}
          <nav
            className="hidden sm:flex w-36 shrink-0 flex-col gap-0.5 border-e border-border/60 bg-muted/30 py-4 px-2"
            aria-label="Form sections"
          >
            {TABS.map(({ id, icon: Icon, labelKey }) => {
              const isActive = activeTab === id;
              const hasTierBadge =
                id === "tiers" && (formData.priceTiers?.length ?? 0) > 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-selected={isActive}
                  aria-current={isActive ? "true" : undefined}
                  className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  }`}
                  id={`fleet-tab-${id}`}
                >
                  <Icon
                    className={`size-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate text-xs">
                    {t(`Dashboard.Fleet.${labelKey}`)}
                  </span>
                  {hasTierBadge && (
                    <span className="ms-auto shrink-0 size-4 flex items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
                      {formData.priceTiers!.length}
                    </span>
                  )}
                  {isActive && (
                    <svg
                      className="ms-auto size-3 shrink-0 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 18l6-6-6-6"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── Tab content ────────────────────────────── */}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              {/* Form field grid — single col on mobile, 2-col on md+ */}
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                {activeTab === "basic" && (
                  <FleetVehicleFormBasic
                    formData={formData}
                    setFormData={setFormData}
                  />
                )}
                {activeTab === "pricing" && (
                  <FleetVehicleFormPricing
                    formData={formData}
                    setFormData={setFormData}
                  />
                )}
                {activeTab === "capacity" && (
                  <FleetVehicleFormCapacity
                    formData={formData}
                    setFormData={setFormData}
                  />
                )}
                {activeTab === "stops" && (
                  <FleetVehicleFormStops
                    formData={formData}
                    setFormData={setFormData}
                  />
                )}
              </div>

              {/* Tiers — full width */}
              {activeTab === "tiers" && (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                  <FleetVehicleFormTiers
                    formData={formData}
                    setFormData={setFormData}
                  />
                </div>
              )}

              {/* Live price preview (pricing + tiers tabs) */}
              {showPreview && (
                <div className="mt-4 sm:mt-5">
                  <FleetVehicleFormPricePreview
                    price={formData.price}
                    pricePerKm={formData.pricePerKm ?? 0}
                    minimumFare={formData.minimumFare ?? 0}
                    priceTiers={formData.priceTiers as IPriceTier[] | undefined}
                  />
                </div>
              )}
            </div>

            {/* ── Footer ──────────────────────────────── */}
            <div className="flex-none border-t border-border/60 bg-card/50 px-4 py-3 sm:px-6 sm:py-4">
              {/* Active toggle */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <label
                  htmlFor="fleet-isActive"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  {t("Dashboard.Fleet.active-available-for-booking")}
                </label>
                <Switch
                  id="fleet-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>

              {/* Action buttons — stacked on mobile, row on sm+ */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2.5">
                <Button
                  type="submit"
                  form="fleet-vehicle-form"
                  disabled={isLoading}
                  className="w-full sm:flex-1 h-11 sm:h-10 rounded-xl gap-1.5 font-semibold"
                  id="fleet-save-btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      {t("Dashboard.Settings.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="size-4" aria-hidden="true" />
                      {editingId
                        ? t("Dashboard.Fleet.update-vehicle")
                        : t("Dashboard.Fleet.add-vehicle")}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full sm:w-auto h-11 sm:h-10 rounded-xl px-4"
                  id="fleet-cancel-btn"
                >
                  {t("Dashboard.Fleet.cancel")}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
