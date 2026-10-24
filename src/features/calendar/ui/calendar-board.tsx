"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarAgenda } from "@/features/calendar/ui/calendar-agenda";
import { CalendarMonthGrid, CalendarTimeGrid } from "@/features/calendar/ui/calendar-grids";

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

function localStamp(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function CalendarBoard() {
  const t = useTranslations("Calendar");
  const [view, setView] = useState<"agenda" | "day" | "week" | "month">("month");
  const [rides, setRides] = useState<Ride[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    from.setDate(from.getDate() - 7);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 7);
    void fetch(`/api/calendar/events?from=${localStamp(from)}&to=${localStamp(to)}`)
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

  const agenda = (
    <CalendarAgenda
      rides={rides}
      timeOff={timeOff}
      emptyLabel={t("empty")}
      timeOffLabel={t("time-off")}
      unassignedLabel={t("unassigned")}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={t("views")} className="hidden flex-wrap gap-2 md:flex">
        {(["month", "week", "day", "agenda"] as const).map((item) => (
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
      <div className="md:hidden">{agenda}</div>
      <div className="hidden md:block">
        {view === "month" ? <CalendarMonthGrid rides={rides} label={t("month")} /> : null}
        {view === "week" ? <CalendarTimeGrid rides={rides} label={t("week")} days={7} /> : null}
        {view === "day" ? <CalendarTimeGrid rides={rides} label={t("day")} days={1} /> : null}
        {view === "agenda" ? agenda : null}
      </div>
    </div>
  );
}
