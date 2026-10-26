"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { PricingExampleFare } from "@/features/pricing/ui/pricing-example-fare";
import { PricingField, PricingNotice, parseAmount, type Notice } from "@/features/pricing/ui/pricing-field";

export type Rule = {
  nightStart: string;
  nightEnd: string;
  nightPercent: number;
  meetGreetPrice: number;
  operatorMinimumFare: number;
  depositPercent: number;
  holidays: { date: string; percent: number }[];
};

type Draft = Omit<Rule, "nightPercent" | "meetGreetPrice" | "operatorMinimumFare" | "depositPercent"> & {
  nightPercent: string;
  meetGreetPrice: string;
  operatorMinimumFare: string;
  depositPercent: string;
};

const toDraft = (rule: Rule): Draft => ({
  ...rule,
  nightPercent: String(rule.nightPercent),
  meetGreetPrice: String(rule.meetGreetPrice),
  operatorMinimumFare: String(rule.operatorMinimumFare),
  depositPercent: String(rule.depositPercent),
});

const LIMITS = { nightPercent: 200, meetGreetPrice: Infinity, operatorMinimumFare: Infinity, depositPercent: 100 } as const;

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
  const [holidayDate, setHolidayDate] = useState("");
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
  const hasErrors = Object.values(errors).some(Boolean);
  const num = (key: keyof typeof LIMITS) => parseAmount(draft[key]) ?? 0;

  const addHoliday = () => {
    const percent = parseAmount(holidayPercent);
    if (!holidayDate || percent === null || percent < 0 || percent > 200) return;
    set({ holidays: [...draft.holidays.filter((h) => h.date !== holidayDate), { date: holidayDate, percent }].sort((a, b) => a.date.localeCompare(b.date)) });
    setHolidayDate("");
    setHolidayPercent("");
  };

  const save = async () => {
    if (hasErrors) {
      setNotice({ tone: "error", text: t("save-failed") });
      return;
    }
    const rule: Rule = { ...draft, nightPercent: num("nightPercent"), meetGreetPrice: num("meetGreetPrice"), operatorMinimumFare: num("operatorMinimumFare"), depositPercent: num("depositPercent") };
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
            <ul className="flex flex-wrap gap-2">
              {draft.holidays.map((holiday) => (
                <li key={holiday.date} className="flex items-center gap-1 rounded-full border border-border bg-muted pl-3 text-sm">
                  <span className="tabular-nums">{holiday.date} · +{holiday.percent}%</span>
                  <Button type="button" variant="ghost" size="icon" className="size-11 rounded-full" aria-label={t("remove-holiday", { date: holiday.date })} onClick={() => set({ holidays: draft.holidays.filter((h) => h.date !== holiday.date) })}>
                    ×
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_8rem_auto]">
            <PricingField label={t("holiday")} type="date" value={holidayDate} onChange={setHolidayDate} />
            <PricingField label={t("holiday-percent")} unit="%" inputMode="decimal" value={holidayPercent} onChange={setHolidayPercent} />
            <Button type="button" variant="outline" className="h-11" disabled={!holidayDate || parseAmount(holidayPercent) === null} onClick={addHoliday}>
              {t("add-holiday")}
            </Button>
          </div>
        </Card>
        <Card title={t("extras-title")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <PricingField label={t("meet")} unit="€" inputMode="decimal" help={t("meet-help")} value={draft.meetGreetPrice} error={errors.meetGreetPrice} onChange={(v) => set({ meetGreetPrice: v })} />
            <PricingField label={t("minimum")} unit="€" inputMode="decimal" help={t("minimum-help")} value={draft.operatorMinimumFare} error={errors.operatorMinimumFare} onChange={(v) => set({ operatorMinimumFare: v })} />
            <PricingField label={t("deposit")} unit="%" inputMode="decimal" help={t("deposit-help")} value={draft.depositPercent} error={errors.depositPercent} onChange={(v) => set({ depositPercent: v })} />
          </div>
        </Card>
      </div>
      <div className="lg:sticky lg:top-4 lg:self-start">
        <PricingExampleFare
          nightPercent={num("nightPercent")}
          holidayPercent={draft.holidays[0]?.percent ?? 0}
          meetGreetPrice={num("meetGreetPrice")}
          minimumFare={num("operatorMinimumFare")}
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
