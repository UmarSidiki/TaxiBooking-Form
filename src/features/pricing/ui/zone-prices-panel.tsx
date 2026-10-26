"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { deletePricing, postPricing, type ZoneRow } from "@/features/pricing/ui/pricing-api";
import { PricingField, PricingNotice, parseAmount, type Notice } from "@/features/pricing/ui/pricing-field";

const empty = { fromLabel: "", toLabel: "", price: "" };

export function ZonePricesPanel({ zones, onChange }: { zones: ZoneRow[]; onChange: () => Promise<void> }) {
  const t = useTranslations("Pricing");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<ZoneRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const price = parseAmount(form.price);
  const errors = {
    fromLabel: form.fromLabel && form.fromLabel.trim().length < 3 ? t("min-chars") : undefined,
    toLabel: form.toLabel && form.toLabel.trim().length < 3 ? t("min-chars") : undefined,
    price: form.price && (price === null || price < 0) ? t("invalid-number") : undefined,
  };
  const valid = form.fromLabel.trim().length >= 3 && form.toLabel.trim().length >= 3 && price !== null && price >= 0;

  const save = async () => {
    setBusy(true);
    const ok = await postPricing({ kind: "zone", fromLabel: form.fromLabel.trim(), toLabel: form.toLabel.trim(), price });
    const renamed = editing && (editing.fromLabel !== form.fromLabel.trim() || editing.toLabel !== form.toLabel.trim());
    if (ok && renamed && editing) await deletePricing("zone", editing._id);
    setNotice({ tone: ok ? "ok" : "error", text: ok ? t("saved") : t("save-failed") });
    if (ok) {
      setForm(empty);
      setEditing(null);
      await onChange();
    }
    setBusy(false);
  };

  const remove = async (zone: ZoneRow) => {
    if (!window.confirm(t("delete-confirm", { name: `${zone.fromLabel} → ${zone.toLabel}` }))) return;
    const ok = await deletePricing("zone", zone._id);
    setNotice({ tone: ok ? "ok" : "error", text: ok ? t("deleted") : t("save-failed") });
    if (ok) await onChange();
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="desk-card flex flex-col gap-3 rounded-md border border-border bg-card p-4">
        <h2 className="font-semibold">{t("zones-list")}</h2>
        {zones.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("zones-empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {zones.map((zone) => (
              <li key={zone._id} className="flex flex-wrap items-center gap-2 py-2">
                <span className="min-w-0 flex-1 break-words text-sm">
                  {zone.fromLabel} → {zone.toLabel}
                </span>
                <span className="font-medium tabular-nums">€{zone.price.toFixed(2)}</span>
                <Button type="button" variant="outline" className="h-11" onClick={() => { setEditing(zone); setForm({ fromLabel: zone.fromLabel, toLabel: zone.toLabel, price: String(zone.price) }); setNotice(null); }}>
                  {t("edit")}
                </Button>
                <Button type="button" variant="outline" className="h-11 text-destructive" onClick={() => void remove(zone)}>
                  {t("delete")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="desk-card flex flex-col gap-4 rounded-md border border-border bg-card p-4">
        <div>
          <h2 className="font-semibold">{editing ? t("zone-edit") : t("zone-add")}</h2>
          <p className="text-sm text-muted-foreground">{t("zone-help")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <PricingField label={t("from")} placeholder={t("from-placeholder")} value={form.fromLabel} error={errors.fromLabel} onChange={(v) => setForm({ ...form, fromLabel: v })} />
          <PricingField label={t("to")} placeholder={t("to-placeholder")} value={form.toLabel} error={errors.toLabel} onChange={(v) => setForm({ ...form, toLabel: v })} />
          <PricingField label={t("price")} unit="€" inputMode="decimal" value={form.price} error={errors.price} onChange={(v) => setForm({ ...form, price: v })} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" className="h-11" disabled={!valid || busy} onClick={() => void save()}>
            {busy ? t("saving") : t("save-zone")}
          </Button>
          {editing ? (
            <Button type="button" variant="ghost" className="h-11" onClick={() => { setEditing(null); setForm(empty); }}>
              {t("cancel")}
            </Button>
          ) : null}
          <PricingNotice notice={notice} />
        </div>
      </section>
    </div>
  );
}
