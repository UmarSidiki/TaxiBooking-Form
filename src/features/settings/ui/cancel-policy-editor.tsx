"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";

import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Tier = { hoursBefore: number; feePercent: number };

export function CancelPolicyEditor() {
  const t = useTranslations();
  const { settings, patch } = useSettingsDesk();
  const tiers: Tier[] = Array.isArray(settings.cancelPolicy)
    ? settings.cancelPolicy.map((tier) => ({
        hoursBefore: Number(tier?.hoursBefore ?? 0),
        feePercent: Number(tier?.feePercent ?? 0),
      }))
    : [{ hoursBefore: 24, feePercent: 0 }];

  const setTiers = (next: Tier[]) => patch("cancelPolicy", next);

  const updateTier = (index: number, key: keyof Tier, value: number) => {
    const next = tiers.map((tier, i) =>
      i === index ? { ...tier, [key]: value } : tier,
    );
    setTiers(next);
  };

  const addTier = () => {
    setTiers([...tiers, { hoursBefore: 0, feePercent: 0 }]);
  };

  const removeTier = (index: number) => {
    const next = tiers.filter((_, i) => i !== index);
    setTiers(next.length > 0 ? next : [{ hoursBefore: 24, feePercent: 0 }]);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground">
        <span>{t("Dashboard.Settings.cancel-policy-hours-before")}</span>
        <span>{t("Dashboard.Settings.cancel-policy-fee-percent")}</span>
        <span />
      </div>
      {tiers.map((tier, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
          <Input
            type="number"
            min={0}
            value={tier.hoursBefore}
            onChange={(e) => updateTier(index, "hoursBefore", Number(e.target.value || 0))}
            className="h-10"
          />
          <Input
            type="number"
            min={0}
            max={100}
            value={tier.feePercent}
            onChange={(e) => updateTier(index, "feePercent", Number(e.target.value || 0))}
            className="h-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => removeTier(index)}
            aria-label={t("Dashboard.Settings.cancel-policy-remove")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="h-9" onClick={addTier}>
        <Plus className="me-1 size-4" />
        {t("Dashboard.Settings.cancel-policy-add")}
      </Button>
    </div>
  );
}