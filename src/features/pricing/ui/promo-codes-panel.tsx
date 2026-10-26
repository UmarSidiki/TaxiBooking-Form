"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { deletePricing, postPricing, type PromoRow } from "@/features/pricing/ui/pricing-api";
import { PricingField, PricingNotice, parseAmount, type Notice } from "@/features/pricing/ui/pricing-field";

const empty = { code: "", kind: "percent" as "percent" | "fixed", amount: "", maxUses: "", maxUsesPerCustomer: "" };

const optionalInt = (value: string) => {
  const parsed = parseAmount(value);
  return parsed === null ? undefined : parsed;
};

export function PromoCodesPanel({ promos, onChange }: { promos: PromoRow[]; onChange: () => Promise<void> }) {
  const t = useTranslations("Pricing");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<PromoRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const amount = parseAmount(form.amount);
  const intError = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = parseAmount(value);
    return parsed === null || parsed < 1 || !Number.isInteger(parsed) ? t("invalid-whole") : undefined;
  };
  const errors = {
    code: form.code && form.code.trim().length < 2 ? t("min-chars-2") : undefined,
    amount: form.amount && (amount === null || amount <= 0 || (form.kind === "percent" && amount > 100)) ? t("invalid-number") : undefined,
    maxUses: intError(form.maxUses),
    maxUsesPerCustomer: intError(form.maxUsesPerCustomer),
  };
  const valid = form.code.trim().length >= 2 && amount !== null && amount > 0 && !Object.values(errors).some(Boolean);

  const save = async () => {
    setBusy(true);
    const code = form.code.trim().toUpperCase();
    const ok = await postPricing({ code, kind: form.kind, amount, maxUses: optionalInt(form.maxUses), maxUsesPerCustomer: optionalInt(form.maxUsesPerCustomer) });
    if (ok && editing && editing.code !== code) await deletePricing("promo", editing._id);
    setNotice({ tone: ok ? "ok" : "error", text: ok ? t("saved") : t("save-failed") });
    if (ok) {
      setForm(empty);
      setEditing(null);
      await onChange();
    }
    setBusy(false);
  };

  const remove = async (promo: PromoRow) => {
    if (!window.confirm(t("delete-confirm", { name: promo.code }))) return;
    const ok = await deletePricing("promo", promo._id);
    setNotice({ tone: ok ? "ok" : "error", text: ok ? t("deleted") : t("save-failed") });
    if (ok) await onChange();
  };

  const discount = (promo: PromoRow) => (promo.kind === "percent" ? `${promo.amount}%` : `€${promo.amount.toFixed(2)}`);

  return (
    <div className="flex flex-col gap-4">
      <section className="desk-card flex flex-col gap-3 rounded-md border border-border bg-card p-4">
        <h2 className="font-semibold">{t("promos-list")}</h2>
        {promos.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("promos-empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {promos.map((promo) => (
              <li key={promo._id} className="flex flex-wrap items-center gap-2 py-2">
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-mono font-semibold">{promo.code}</span>{" "}
                  <span className="text-muted-foreground">
                    {t("promo-summary", {
                      discount: discount(promo),
                      used: promo.usedCount ?? 0,
                      limit: promo.maxUses ?? "∞",
                      perCustomer: promo.maxUsesPerCustomer ?? "∞",
                    })}
                  </span>
                </span>
                <Button type="button" variant="outline" className="h-11" onClick={() => { setEditing(promo); setForm({ code: promo.code, kind: promo.kind, amount: String(promo.amount), maxUses: promo.maxUses ? String(promo.maxUses) : "", maxUsesPerCustomer: promo.maxUsesPerCustomer ? String(promo.maxUsesPerCustomer) : "" }); setNotice(null); }}>
                  {t("edit")}
                </Button>
                <Button type="button" variant="outline" className="h-11 text-destructive" onClick={() => void remove(promo)}>
                  {t("delete")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="desk-card flex flex-col gap-4 rounded-md border border-border bg-card p-4">
        <h2 className="font-semibold">{editing ? t("promo-edit") : t("promo-add")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <PricingField label={t("code")} placeholder="SAVE10" value={form.code} error={errors.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} />
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">{t("kind")}</legend>
            <div className="grid grid-cols-2 gap-1 rounded-md border border-border p-1">
              {(["percent", "fixed"] as const).map((kind) => (
                <label key={kind} className={`flex h-10 cursor-pointer items-center justify-center rounded text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${form.kind === kind ? "bg-primary text-primary-foreground" : ""}`}>
                  <input type="radio" name="promo-kind" value={kind} className="sr-only" checked={form.kind === kind} onChange={() => setForm({ ...form, kind })} />
                  {kind === "percent" ? t("percent") : t("fixed")}
                </label>
              ))}
            </div>
          </fieldset>
          <PricingField label={t("amount")} unit={form.kind === "percent" ? "%" : "€"} inputMode="decimal" value={form.amount} error={errors.amount} onChange={(v) => setForm({ ...form, amount: v })} />
          <PricingField label={t("max-uses")} inputMode="numeric" help={t("unlimited-help")} value={form.maxUses} error={errors.maxUses} onChange={(v) => setForm({ ...form, maxUses: v })} />
          <PricingField label={t("per-customer")} inputMode="numeric" help={t("unlimited-help")} value={form.maxUsesPerCustomer} error={errors.maxUsesPerCustomer} onChange={(v) => setForm({ ...form, maxUsesPerCustomer: v })} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" className="h-11" disabled={!valid || busy} onClick={() => void save()}>
            {busy ? t("saving") : t("save-promo")}
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
