"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Rule = {
  nightStart: string;
  nightEnd: string;
  nightPercent: number;
  meetGreetPrice: number;
  operatorMinimumFare: number;
  depositPercent: number;
  holidays: { date: string; percent: number }[];
};

const emptyRule: Rule = {
  nightStart: "22:00",
  nightEnd: "06:00",
  nightPercent: 0,
  meetGreetPrice: 0,
  operatorMinimumFare: 0,
  depositPercent: 0,
  holidays: [],
};

export function PricingDesk() {
  const t = useTranslations("Pricing");
  const [rule, setRule] = useState<Rule>(emptyRule);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayPercent, setHolidayPercent] = useState("0");
  const [zone, setZone] = useState({ fromLabel: "", toLabel: "", price: "" });
  const [promo, setPromo] = useState({ code: "", kind: "percent", amount: "", maxUses: "", maxUsesPerCustomer: "" });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/pricing")
      .then((response) => response.json())
      .then((data) => {
        if (data.rule) setRule({ ...emptyRule, ...data.rule, holidays: data.rule.holidays ?? [], depositPercent: data.rule.depositPercent ?? 0 });
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const saveRule = async () => {
    const response = await fetch("/api/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    });
    setNotice(response.ok ? t("saved") : t("save-failed"));
  };

  if (status === "loading") return <p role="status">{t("loading")}</p>;
  if (status === "error") return <p role="alert">{t("load-failed")}</p>;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {notice ? <p role="status">{notice}</p> : null}
      <section className="flex flex-col gap-3 rounded-md border border-border p-4">
        <h2 className="font-semibold">{t("rules")}</h2>
        <label className="text-sm" htmlFor="night-start">{t("night")}</label>
        <div className="grid grid-cols-3 gap-2">
          <Input id="night-start" className="h-11" value={rule.nightStart} onChange={(event) => setRule({ ...rule, nightStart: event.target.value })} />
          <Input className="h-11" aria-label={t("night-end")} value={rule.nightEnd} onChange={(event) => setRule({ ...rule, nightEnd: event.target.value })} />
          <Input className="h-11" aria-label={t("night-percent")} value={String(rule.nightPercent)} onChange={(event) => setRule({ ...rule, nightPercent: Number(event.target.value) || 0 })} />
        </div>
        <label className="text-sm" htmlFor="meet">{t("meet")}</label>
        <Input id="meet" className="h-11" value={String(rule.meetGreetPrice)} onChange={(event) => setRule({ ...rule, meetGreetPrice: Number(event.target.value) || 0 })} />
        <label className="text-sm" htmlFor="minimum">{t("minimum")}</label>
        <Input id="minimum" className="h-11" value={String(rule.operatorMinimumFare)} onChange={(event) => setRule({ ...rule, operatorMinimumFare: Number(event.target.value) || 0 })} />
        <label className="text-sm" htmlFor="deposit">{t("deposit")}</label>
        <Input id="deposit" className="h-11" value={String(rule.depositPercent)} onChange={(event) => setRule({ ...rule, depositPercent: Number(event.target.value) || 0 })} />
        <div className="grid grid-cols-[1fr_8rem_auto] gap-2">
          <Input className="h-11" type="date" aria-label={t("holiday")} value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} />
          <Input className="h-11" aria-label={t("holiday-percent")} value={holidayPercent} onChange={(event) => setHolidayPercent(event.target.value)} />
          <Button type="button" className="h-11" onClick={() => {
            if (!holidayDate) return;
            setRule({ ...rule, holidays: [...rule.holidays, { date: holidayDate, percent: Number(holidayPercent) || 0 }] });
          }}>{t("add-holiday")}</Button>
        </div>
        <Button type="button" className="h-11 w-fit" onClick={() => void saveRule()}>{t("save")}</Button>
      </section>
      <section className="flex flex-col gap-3 rounded-md border border-border p-4">
        <h2 className="font-semibold">{t("zone")}</h2>
        <Input className="h-11" aria-label={t("from")} value={zone.fromLabel} onChange={(event) => setZone({ ...zone, fromLabel: event.target.value })} />
        <Input className="h-11" aria-label={t("to")} value={zone.toLabel} onChange={(event) => setZone({ ...zone, toLabel: event.target.value })} />
        <Input className="h-11" aria-label={t("price")} value={zone.price} onChange={(event) => setZone({ ...zone, price: event.target.value })} />
        <Button type="button" className="h-11 w-fit" onClick={() => void fetch("/api/admin/pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "zone", ...zone, price: Number(zone.price) }) }).then((response) => setNotice(response.ok ? t("saved") : t("save-failed")))}>{t("save-zone")}</Button>
      </section>
      <section className="flex flex-col gap-3 rounded-md border border-border p-4">
        <h2 className="font-semibold">{t("promo")}</h2>
        <Input className="h-11" aria-label={t("code")} value={promo.code} onChange={(event) => setPromo({ ...promo, code: event.target.value })} />
        <select className="h-11 rounded-md border border-border bg-background px-3" aria-label={t("kind")} value={promo.kind} onChange={(event) => setPromo({ ...promo, kind: event.target.value })}>
          <option value="percent">{t("percent")}</option>
          <option value="fixed">{t("fixed")}</option>
        </select>
        <Input className="h-11" aria-label={t("amount")} value={promo.amount} onChange={(event) => setPromo({ ...promo, amount: event.target.value })} />
        <Input className="h-11" aria-label={t("max-uses")} value={promo.maxUses} onChange={(event) => setPromo({ ...promo, maxUses: event.target.value })} />
        <Input className="h-11" aria-label={t("per-customer")} value={promo.maxUsesPerCustomer} onChange={(event) => setPromo({ ...promo, maxUsesPerCustomer: event.target.value })} />
        <Button type="button" className="h-11 w-fit" onClick={() => void fetch("/api/admin/pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: promo.code, kind: promo.kind, amount: Number(promo.amount), maxUses: promo.maxUses ? Number(promo.maxUses) : undefined, maxUsesPerCustomer: promo.maxUsesPerCustomer ? Number(promo.maxUsesPerCustomer) : undefined }) }).then((response) => setNotice(response.ok ? t("saved") : t("save-failed")))}>{t("save-promo")}</Button>
      </section>
    </div>
  );
}
