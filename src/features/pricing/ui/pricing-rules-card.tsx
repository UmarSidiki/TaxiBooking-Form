"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { PricingExampleFare } from "@/features/pricing/ui/pricing-example-fare";
import { PricingField, PricingNotice, parseAmount, type Notice } from "@/features/pricing/ui/pricing-field";
import { Switch } from "@/shared/ui/switch";
import { EXTRA_KEYS, type PricingExtras } from "@/features/pricing/lib/quote-fare";
import { addDays, rangesOverlap, type HolidayRange } from "@/features/pricing/lib/holidays";

export type Rule = {
  nightStart: string;
  nightEnd: string;
  nightPercent: number;
  depositPercent: number;
  holidays: HolidayRange[];
  extras: PricingExtras;
};

type ExtraKey = (typeof EXTRA_KEYS)[number];
type Draft = Omit<Rule, "nightPercent" | "depositPercent" | "extras"> & {
  nightPercent: string;
  depositPercent: string;
  extras: Record<ExtraKey, { enabled: boolean; price: string }>;
};

const toDraft = (rule: Rule): Draft => ({
  ...rule,
  nightPercent: String(rule.nightPercent),
  depositPercent: String(rule.depositPercent),
  extras: Object.fromEntries(
    EXTRA_KEYS.map((key) => [key, { enabled: rule.extras[key].enabled, price: String(rule.extras[key].price) }]),
  ) as Draft["extras"],
});

const LIMITS = { nightPercent: 200, depositPercent: 100 } as const;

/** Hours until a range is removed (12h after its end day), using this device's clock. */
function hoursLeft(end: string) {
  const removeAt = new Date(`${addDays(end, 1)}T12:00:00`).getTime();
  const ms = removeAt - Date.now();
  return ms <= 48 * 3_600_000 ? Math.max(0, Math.ceil(ms / 3_600_000)) : null;
}

function Card({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="desk-card flex flex-col gap-4 rounded-md border border-border bg-card p-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {help ? <p className="text-sm text-muted-foreground">{help}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function PricingRulesCard({ initial, onSaved }: { initial: Rule; onSaved: (rule: Rule) => void }) {
  const t = useTranslations("Pricing");
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [holidayStart, setHolidayStart] = useState("");
  const [holidayEnd, setHolidayEnd] = useState("");
  const [holidayPercent, setHolidayPercent] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(initial));
  const set = (patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setNotice(null);
  };

  const errors = Object.fromEntries(
    (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).map((key) => {
      const value = parseAmount(draft[key]);
      return [key, value === null || value < 0 || value > LIMITS[key] ? t("invalid-number") : undefined];
    }),
  ) as Record<keyof typeof LIMITS, string | undefined>;
  const extraErrors = Object.fromEntries(
    EXTRA_KEYS.map((key) => {
      const value = parseAmount(draft.extras[key].price);
      return [key, draft.extras[key].enabled && (value === null || value < 0) ? t("invalid-number") : undefined];
    }),
  ) as Record<ExtraKey, string | undefined>;
  const hasErrors = [...Object.values(errors), ...Object.values(extraErrors)].some(Boolean);
  const setExtra = (key: ExtraKey, patch: Partial<Draft["extras"][ExtraKey]>) =>
    set({ extras: { ...draft.extras, [key]: { ...draft.extras[key], ...patch } } });

  const newRange: HolidayRange = { start: holidayStart, end: holidayEnd || holidayStart, percent: parseAmount(holidayPercent) ?? 0 };
  const rangeError = holidayStart && newRange.end < newRange.start ? t("holiday-end-before-start") : undefined;
  const overlapping = holidayStart && !rangeError ? draft.holidays.filter((range) => rangesOverlap(range, newRange)) : [];
  const rangeText = (range: HolidayRange) => (range.start === range.end ? range.start : `${range.start} → ${range.end}`);
  const num = (key: keyof typeof LIMITS) => parseAmount(draft[key]) ?? 0;
  const extrasNow = Object.fromEntries(
    EXTRA_KEYS.map((key) => [key, { enabled: draft.extras[key].enabled, price: parseAmount(draft.extras[key].price) ?? 0 }]),
  ) as PricingExtras;

  const addHoliday = () => {
    const percent = parseAmount(holidayPercent);
    if (!holidayStart || rangeError || percent === null || percent < 0 || percent > 200) return;
    set({ holidays: [...draft.holidays, { ...newRange, percent }].sort((a, b) => a.start.localeCompare(b.start)) });
    setHolidayStart("");
    setHolidayEnd("");
    setHolidayPercent("");
  };

  const save = async () => {
    if (hasErrors) {
      setNotice({ tone: "error", text: t("save-failed") });
      return;
    }
    const rule: Rule = {
      ...draft,
      nightPercent: num("nightPercent"),
      depositPercent: num("depositPercent"),
      extras: extrasNow,
    };
    setSaving(true);
    try {
      const response = await fetch("/api/admin/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rule) });
      if (!response.ok) throw new Error();
      onSaved(rule);
      setNotice({ tone: "ok", text: t("saved") });
    } catch {
      setNotice({ tone: "error", text: t("save-failed") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 pb-24 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        <Card title={t("night-title")} help={t("night-help")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <PricingField label={t("night-start")} type="time" value={draft.nightStart} onChange={(v) => set({ nightStart: v })} />
            <PricingField label={t("night-end")} type="time" value={draft.nightEnd} onChange={(v) => set({ nightEnd: v })} />
            <PricingField label={t("night-percent")} unit="%" inputMode="decimal" value={draft.nightPercent} error={errors.nightPercent} onChange={(v) => set({ nightPercent: v })} />
          </div>
        </Card>
        <Card title={t("holidays-title")} help={t("holidays-help")}>
          {draft.holidays.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("holidays-empty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {draft.holidays.map((range, index) => {
                const left = hoursLeft(range.end);
                return (
                  <li key={`${range.start}-${range.end}-${index}`} className="flex min-h-11 items-center gap-2 rounded-xl bg-muted/50 pl-3 text-sm">
                    <span className="min-w-0 flex-1 tabular-nums">
                      {rangeText(range)} · +{range.percent}%
                      {left !== null ? <span className="block text-xs text-muted-foreground">{t("holiday-removed-in", { hours: left })}</span> : null}
                    </span>
                    <Button type="button" variant="ghost" size="icon" className="size-11 rounded-full" aria-label={t("remove-holiday", { date: rangeText(range) })} onClick={() => set({ holidays: draft.holidays.filter((_, i) => i !== index) })}>
                      ×
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_7rem_auto]">
            <PricingField label={t("holiday-start")} type="date" value={holidayStart} onChange={(v) => { setHolidayStart(v); if (!holidayEnd || holidayEnd < v) setHolidayEnd(v); }} />
            <PricingField label={t("holiday-end")} type="date" value={holidayEnd} error={rangeError} onChange={setHolidayEnd} />
            <PricingField label={t("holiday-percent")} unit="%" inputMode="decimal" value={holidayPercent} onChange={setHolidayPercent} />
            <Button type="button" variant="outline" className="h-11 sm:mt-[1.625rem]" disabled={!holidayStart || Boolean(rangeError) || parseAmount(holidayPercent) === null} onClick={addHoliday}>
              {t("add-holiday")}
            </Button>
          </div>
          {overlapping.length > 0 ? (
            <p role="status" className="rounded-md border border-amber-600/40 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {t("holiday-overlap", { ranges: overlapping.map(rangeText).join(", ") })}
            </p>
          ) : null}
        </Card>
        <Card title={t("extras-title")} help={t("extras-help")}>
          <ul className="flex flex-col gap-2">
            {EXTRA_KEYS.map((key) => (
              <li key={key} className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3 sm:flex-row sm:items-start">
                <div className="flex min-h-11 flex-1 items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <span id={`extra-${key}`} className="text-sm font-medium">{t(`extra-${key}`)}</span>
                    <span className="text-xs text-muted-foreground">{draft.extras[key].enabled ? t("extra-shown") : t("extra-hidden")}</span>
                  </span>
                  <Switch checked={draft.extras[key].enabled} aria-labelledby={`extra-${key}`} onCheckedChange={(enabled) => setExtra(key, { enabled })} />
                </div>
                {draft.extras[key].enabled ? (
                  <div className="sm:w-40">
                    <PricingField label={key === "meetGreet" ? t("extra-price") : t("extra-price-each")} unit="€" inputMode="decimal" value={draft.extras[key].price} error={extraErrors[key]} onChange={(v) => setExtra(key, { price: v })} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
        <Card title={t("payment-title")}>
          <div className="sm:max-w-xs">
            <PricingField label={t("deposit")} unit="%" inputMode="decimal" help={t("deposit-help")} value={draft.depositPercent} error={errors.depositPercent} onChange={(v) => set({ depositPercent: v })} />
          </div>
        </Card>
      </div>
      <div className="lg:sticky lg:top-4 lg:self-start">
        <PricingExampleFare
          night={{ start: draft.nightStart, end: draft.nightEnd, percent: num("nightPercent") }}
          holidays={draft.holidays}
          extras={extrasNow}
          depositPercent={num("depositPercent")}
        />
      </div>
      {dirty || notice ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-3">
            <div className="mr-auto">
              {dirty && !notice ? <p className="text-sm text-muted-foreground">{t("unsaved")}</p> : <PricingNotice notice={notice} />}
            </div>
            {dirty ? (
              <>
                <Button type="button" variant="ghost" className="h-11" disabled={saving} onClick={() => { setDraft(toDraft(initial)); setNotice(null); }}>
                  {t("discard")}
                </Button>
                <Button type="button" className="h-11" disabled={saving} onClick={() => void save()}>
                  {saving ? t("saving") : t("save")}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
