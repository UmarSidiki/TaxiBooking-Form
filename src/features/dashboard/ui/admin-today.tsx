"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type TodayData = {
  date: string;
  unassigned: Array<{ _id: string; tripId: string; time: string; pickup: string }>;
  deadlines: Array<{ _id: string; tripId: string; time: string; pickup: string }>;
  balances: Array<{ _id: string; name: string; balance?: number }>;
};

export function AdminToday() {
  const t = useTranslations("Today");
  const [data, setData] = useState<TodayData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/today")
      .then((response) => response.json())
      .then((body) => {
        if (!body.success) setError(t("load-error"));
        else setData(body);
      })
      .catch(() => setError(t("load-error")));
  }, [t]);

  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">{t("loading")}</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="font-semibold">{t("unassigned")}</h2>
        {data.unassigned.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t("empty")}</p> : null}
        <ul className="mt-2 flex flex-col gap-2">
          {data.unassigned.map((ride) => (
            <li key={ride._id} className="text-sm">{ride.time} {ride.pickup}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="font-semibold">{t("deadlines")}</h2>
        {data.deadlines.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t("empty")}</p> : null}
        <ul className="mt-2 flex flex-col gap-2">
          {data.deadlines.map((ride) => (
            <li key={ride._id} className="text-sm">{ride.time} {ride.pickup}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="font-semibold">{t("balances")}</h2>
        {data.balances.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t("empty")}</p> : null}
        <ul className="mt-2 flex flex-col gap-2">
          {data.balances.map((partner) => (
            <li key={partner._id} className="text-sm">{partner.name} {partner.balance}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
