"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { PromoRow, ZoneRow } from "@/features/pricing/ui/pricing-api";
import { PricingRulesCard, type Rule } from "@/features/pricing/ui/pricing-rules-card";
import { PromoCodesPanel } from "@/features/pricing/ui/promo-codes-panel";
import { ZonePricesPanel } from "@/features/pricing/ui/zone-prices-panel";

const emptyRule: Rule = {
  nightStart: "22:00",
  nightEnd: "06:00",
  nightPercent: 0,
  meetGreetPrice: 0,
  operatorMinimumFare: 0,
  depositPercent: 0,
  holidays: [],
};

type Data = { rule: Rule; zones: ZoneRow[]; promos: PromoRow[] };

export function PricingDesk() {
  const t = useTranslations("Pricing");
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/pricing");
      if (!response.ok) throw new Error();
      const body = await response.json();
      setData({
        rule: { ...emptyRule, ...body.rule, holidays: body.rule?.holidays ?? [], depositPercent: body.rule?.depositPercent ?? 0 },
        zones: body.zones ?? [],
        promos: body.promos ?? [],
      });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        <Link href="/dashboard/fleet" className="inline-flex min-h-11 w-fit items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
          {t("fleet-link")} →
        </Link>
      </div>
      {status === "loading" ? (
        <div role="status" aria-label={t("loading")} className="flex flex-col gap-4">
          <Skeleton className="h-11 w-full max-w-md" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : status === "error" || !data ? (
        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          <p role="alert">{t("load-failed")}</p>
          <Button type="button" className="h-11 w-fit" onClick={() => { setStatus("loading"); void load(); }}>
            {t("retry")}
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="rules">
          <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit">
            <TabsTrigger value="rules" className="min-h-11 whitespace-normal">{t("tab-rules")}</TabsTrigger>
            <TabsTrigger value="zones" className="min-h-11 whitespace-normal">{t("tab-zones")} ({data.zones.length})</TabsTrigger>
            <TabsTrigger value="promos" className="min-h-11 whitespace-normal">{t("tab-promos")} ({data.promos.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="rules" className="mt-2">
            <PricingRulesCard initial={data.rule} onSaved={(rule) => setData({ ...data, rule })} />
          </TabsContent>
          <TabsContent value="zones" className="mt-2">
            <ZonePricesPanel zones={data.zones} onChange={load} />
          </TabsContent>
          <TabsContent value="promos" className="mt-2">
            <PromoCodesPanel promos={data.promos} onChange={load} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
