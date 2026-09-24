"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { FleetVehicleFormFieldsProps } from "@/features/fleet/ui/fleet-vehicle-form-fields";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useCurrency } from "@/shared/context/currency-context";

type Tier = { upToKm: number; type: "flat" | "per_km"; price: number };

export function FleetVehicleFormTiers({
  formData,
  setFormData,
}: FleetVehicleFormFieldsProps) {
  const t = useTranslations();
  const { currencySymbol } = useCurrency();

  const tiers: Tier[] = (formData.priceTiers ?? []) as Tier[];

  const updateTier = (index: number, patch: Partial<Tier>) => {
    const next = tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier));
    setFormData({ ...formData, priceTiers: next });
  };

  const addTier = () => {
    const lastUpTo = tiers[tiers.length - 1]?.upToKm ?? 0;
    const newTier: Tier = { upToKm: lastUpTo + 10, type: "per_km", price: 0 };
    setFormData({ ...formData, priceTiers: [...tiers, newTier] });
  };

  const removeTier = (index: number) => {
    const next = tiers.filter((_, i) => i !== index);
    setFormData({ ...formData, priceTiers: next });
  };

  return (
    <>
      {/* Action row */}
      <div className="md:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {t("Dashboard.Fleet.price-tiers-description")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTier}
            className="gap-1.5 min-h-9 rounded-xl"
            id="add-price-tier-btn"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {t("Dashboard.Fleet.add-tier")}
          </Button>
        </div>
      </div>

      {/* Tier rows */}
      <div className="md:col-span-2 space-y-3">
        {tiers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            {t("Dashboard.Fleet.no-tiers")}
          </p>
        ) : (
          <>
            {/* Column headers */}
            <div
              className="grid gap-2 text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}
            >
              <span>{t("Dashboard.Fleet.tier-up-to-km")}</span>
              <span>{t("Dashboard.Fleet.tier-type")}</span>
              <span>{t("Dashboard.Fleet.tier-price", { 0: currencySymbol })}</span>
              <span />
            </div>

            {tiers.map((tier, index) => (
              <div
                key={index}
                className="grid gap-2 items-center"
                style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}
              >
                {/* Up-to km */}
                <Input
                  id={`tier-upToKm-${index}`}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="30"
                  value={tier.upToKm}
                  onChange={(e) =>
                    updateTier(index, {
                      upToKm: parseFloat(e.target.value) || 0,
                    })
                  }
                  aria-label={t("Dashboard.Fleet.tier-up-to-km")}
                />

                {/* Type selector */}
                <Select
                  value={tier.type}
                  onValueChange={(value: "flat" | "per_km") =>
                    updateTier(index, { type: value })
                  }
                >
                  <SelectTrigger id={`tier-type-${index}`} aria-label={t("Dashboard.Fleet.tier-type")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">
                      {t("Dashboard.Fleet.tier-type-flat")}
                    </SelectItem>
                    <SelectItem value="per_km">
                      {t("Dashboard.Fleet.tier-type-per-km")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Price */}
                <Input
                  id={`tier-price-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={tier.price}
                  onChange={(e) =>
                    updateTier(index, {
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  aria-label={t("Dashboard.Fleet.tier-price", { 0: currencySymbol })}
                />

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeTier(index)}
                  aria-label={t("Dashboard.Fleet.remove-tier", { index: index + 1 })}
                  id={`remove-tier-${index}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}

            <p className="text-xs text-muted-foreground mt-1">
              {t("Dashboard.Fleet.price-tiers-hint")}
            </p>
          </>
        )}
      </div>
    </>
  );
}
