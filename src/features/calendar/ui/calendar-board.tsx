"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Ride = {
  _id: string;
  tripId: string;
  date: string;
  time: string;
  pickup: string;
  dropoff?: string;
  assignedDriver?: { name?: string };
  assignedPartner?: { name?: string };
};

type TimeOff = { _id: string; startsAt: string; endsAt: string; note?: string };

export function CalendarBoard() {
  const t = useTranslations("Calendar");
  const [view, setView] = useState<"agenda" | "day" | "week" | "month">("agenda");
  const [rides, setRides] = useState<Ride[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const stamp = (date: Date) => date.toISOString().slice(0, 10);
    void fetch(`/api/calendar/events?from=${stamp(from)}&to=${stamp(to)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          setError(t("load-error"));
          return;
        }
        setRides(data.rides ?? []);
        setTimeOff(data.timeOff ?? []);
      })
      .catch(() => setError(t("load-error")))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={t("views")} className="flex flex-wrap gap-2">
        {(["agenda", "day", "week", "month"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={view === item}
            className={`h-11 rounded-md border px-4 text-sm ${view === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
            onClick={() => setView(item)}
          >
            {t(item)}
          </button>
        ))}
      </div>
      {loading ? <p role="status">{t("loading")}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {!loading && rides.length === 0 && timeOff.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {timeOff.map((off) => (
          <li key={off._id} className="rounded-md border border-border bg-muted p-4">
            <p className="font-medium">{t("time-off")}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(off.startsAt).toLocaleString()} – {new Date(off.endsAt).toLocaleString()}
            </p>
          </li>
        ))}
        {(view === "month" ? rides : rides.slice(0, view === "day" ? 8 : rides.length)).map((ride) => (
          <li key={ride._id} className="rounded-md border border-border bg-card p-4">
            <p className="font-medium">{ride.date} {ride.time}</p>
            <p className="text-sm">{ride.pickup}{ride.dropoff ? ` → ${ride.dropoff}` : ""}</p>
            <p className="text-sm text-muted-foreground">
              {ride.assignedDriver?.name || ride.assignedPartner?.name || t("unassigned")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
