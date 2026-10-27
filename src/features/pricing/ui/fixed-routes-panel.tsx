"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import type { RoutePlace } from "@/features/pricing/lib/fixed-routes";
import { deletePricing, postPricing, type RouteRow } from "@/features/pricing/ui/pricing-api";
import { PricingField, PricingNotice, parseAmount, type Notice } from "@/features/pricing/ui/pricing-field";
import { RouteAddressInput } from "@/features/pricing/ui/route-address-input";

type PlaceDraft = { text: string; place: Omit<RoutePlace, "radiusKm"> | null; radiusKm: string };
type Side = "from" | "to";
type RouteDraft = { id?: string; from: PlaceDraft[]; to: PlaceDraft[]; price: string; bothWays: boolean };

const blankPlace = (): PlaceDraft => ({ text: "", place: null, radiusKm: "2" });
const blankRoute = (): RouteDraft => ({ from: [blankPlace()], to: [blankPlace()], price: "", bothWays: false });
const toDraft = (route: RouteRow): RouteDraft => ({
  id: route._id,
  price: String(route.price),
  bothWays: Boolean(route.bothWays),
  from: route.from.map((p) => ({ text: p.label, place: p, radiusKm: String(p.radiusKm) })),
  to: route.to.map((p) => ({ text: p.label, place: p, radiusKm: String(p.radiusKm) })),
});

function radiusError(value: string) {
  const parsed = parseAmount(value);
  return parsed === null || parsed < 0.1 || parsed > 50;
}

export function FixedRoutesPanel({ routes, onChange }: { routes: RouteRow[]; onChange: () => Promise<void> }) {
  const t = useTranslations("Pricing");
  const [draft, setDraft] = useState<RouteDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const updatePlace = (side: Side, index: number, patch: Partial<PlaceDraft>) =>
    setDraft((prev) => prev && { ...prev, [side]: prev[side].map((row, i) => (i === index ? { ...row, ...patch } : row)) });

  const price = draft ? parseAmount(draft.price) : null;
  const placeErrors = (row: PlaceDraft) => ({
    address: row.text && !row.place ? t("route-pick-address") : undefined,
    radius: radiusError(row.radiusKm) ? t("route-radius-range") : undefined,
  });
  const valid =
    draft !== null &&
    price !== null &&
    price >= 0 &&
    (["from", "to"] as const).every((side) => draft[side].length > 0 && draft[side].every((row) => row.place && !radiusError(row.radiusKm)));

  const save = async () => {
    if (!draft || !valid) return;
    setBusy(true);
    const places = (side: Side) => draft[side].map((row) => ({ ...row.place!, radiusKm: parseAmount(row.radiusKm)! }));
    const ok = await postPricing({ kind: "route", id: draft.id, from: places("from"), to: places("to"), price, bothWays: draft.bothWays });
    setNotice({ tone: ok ? "ok" : "error", text: ok ? t("saved") : t("save-failed") });
    if (ok) {
      setDraft(null);
      await onChange();
    }
    setBusy(false);
  };

  const remove = async (route: RouteRow) => {
    if (!window.confirm(t("route-delete-confirm", { price: route.price.toFixed(2) }))) return;
    const ok = await deletePricing("route", route._id);
    setNotice({ tone: ok ? "ok" : "error", text: ok ? t("deleted") : t("save-failed") });
    if (ok) await onChange();
  };

  const summary = (places: RoutePlace[]) =>
    places.length === 1 ? places[0].label : t("route-places", { first: places[0]?.label ?? "", count: places.length - 1 });

  const sideEditor = (side: Side) => (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold">{side === "from" ? t("route-point-a") : t("route-point-b")}</legend>
      {draft![side].map((row, index) => {
        const errors = placeErrors(row);
        return (
          <div key={index} className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 sm:flex-row sm:items-start">
            <RouteAddressInput
              label={t("route-address", { n: index + 1 })}
              value={row.text}
              error={errors.address}
              onText={(text) => updatePlace(side, index, { text, place: null })}
              onPick={(place) => updatePlace(side, index, { text: place.label, place })}
            />
            <div className="flex items-start gap-2">
              <div className="w-28">
                <PricingField label={t("route-radius")} unit="km" inputMode="decimal" value={row.radiusKm} error={errors.radius} onChange={(radiusKm) => updatePlace(side, index, { radiusKm })} />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mt-[1.625rem] h-11"
                disabled={draft![side].length === 1}
                aria-label={t("route-remove-address", { n: index + 1 })}
                onClick={() => setDraft((prev) => prev && { ...prev, [side]: prev[side].filter((_, i) => i !== index) })}
              >
                {t("remove")}
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-fit"
        disabled={draft![side].length >= 20}
        onClick={() => setDraft((prev) => prev && { ...prev, [side]: [...prev[side], blankPlace()] })}
      >
        + {t("route-add-address")}
      </Button>
    </fieldset>
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="desk-card flex flex-col gap-3 rounded-md border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">{t("routes-list")}</h2>
            <p className="text-sm text-muted-foreground">{t("route-help")}</p>
          </div>
          {draft ? null : (
            <Button type="button" className="h-11" onClick={() => { setDraft(blankRoute()); setNotice(null); }}>
              + {t("route-add")}
            </Button>
          )}
        </div>
        {routes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("routes-empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {routes.map((route) => (
              <li key={route._id} className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/50 p-3">
                <span className="min-w-0 flex-1 break-words text-sm">
                  {summary(route.from)} {route.bothWays ? "⇄" : "→"} {summary(route.to)}
                  {route.needsReview ? (
                    <span className="ml-2 inline-flex rounded-full border border-amber-600/40 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      {t("route-needs-review")}
                    </span>
                  ) : null}
                </span>
                <span className="font-medium tabular-nums">€{route.price.toFixed(2)}</span>
                <Button type="button" variant="outline" className="h-11" onClick={() => { setDraft(toDraft(route)); setNotice(null); }}>
                  {t("edit")}
                </Button>
                <Button type="button" variant="outline" className="h-11 text-destructive" onClick={() => void remove(route)}>
                  {t("delete")}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {draft ? null : <PricingNotice notice={notice} />}
      </section>
      {draft ? (
        <section aria-labelledby="route-editor-title" className="desk-card flex flex-col gap-5 rounded-md border border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div>
            <h2 id="route-editor-title" className="font-semibold">{draft.id ? t("route-edit") : t("route-add")}</h2>
            <p className="text-sm text-muted-foreground">{t("route-editor-help")}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {sideEditor("from")}
            {sideEditor("to")}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="sm:w-48">
              <PricingField label={t("price")} unit="€" inputMode="decimal" value={draft.price} error={draft.price && (price === null || price < 0) ? t("invalid-number") : undefined} onChange={(value) => setDraft({ ...draft, price: value })} />
            </div>
            <div className="flex min-h-11 flex-1 items-center justify-between gap-3 rounded-xl bg-muted/50 p-3 sm:mt-[1.625rem]">
              <span className="flex flex-col">
                <span id="route-both-ways" className="text-sm font-medium">{t("route-both-ways")}</span>
                <span className="text-xs text-muted-foreground">{t("route-both-ways-help")}</span>
              </span>
              <Switch checked={draft.bothWays} aria-labelledby="route-both-ways" onCheckedChange={(bothWays) => setDraft({ ...draft, bothWays })} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" className="h-11" disabled={!valid || busy} onClick={() => void save()}>
              {busy ? t("saving") : t("save-route")}
            </Button>
            <Button type="button" variant="ghost" className="h-11" disabled={busy} onClick={() => setDraft(null)}>
              {t("cancel")}
            </Button>
            <PricingNotice notice={notice} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
