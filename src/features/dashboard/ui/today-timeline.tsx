"use client";

import { useTranslations } from "next-intl";

import { StatusMark } from "@/features/dashboard/ui/riviera/status-mark";
import { buildTimeline, type TimelineRide } from "@/features/dashboard/lib/today-timeline";

const pad = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/** Today's rides on an hour grid; the current hour carries a "now" rule. */
export function TodayTimeline({ rides, nowHour }: { rides: TimelineRide[]; nowHour: number }) {
  const t = useTranslations("Today");
  const rows = buildTimeline(rides);

  return (
    <section aria-labelledby="today-timeline" className="today-timeline">
      <header className="today-timeline__head">
        <h2 id="today-timeline">{t("timeline")}</h2>
        <p className="num">{t("ride-count", { count: rides.length })}</p>
      </header>
      <ol>
        {rows.map(({ hour, rides: list }) => (
          <li key={hour} className={hour === nowHour ? "is-now" : undefined} aria-current={hour === nowHour ? "time" : undefined}>
            <span className="today-timeline__hour num">{pad(hour)}</span>
            <div className="today-timeline__slot">
              {hour === nowHour ? <span className="today-timeline__now">{t("now")}</span> : null}
              {list.map((ride) => {
                const assignee = ride.driverName ?? ride.partnerName;
                return (
                  <article key={ride._id} className="today-timeline__ride">
                    <span className="num">{ride.time}</span>
                    <span className="today-timeline__route">
                      {ride.pickup}
                      {ride.dropoff ? <> → {ride.dropoff}</> : null}
                    </span>
                    {assignee ? (
                      <StatusMark tone="ok" label={assignee} />
                    ) : (
                      <StatusMark tone="warn" label={t("unassigned-mark")} />
                    )}
                  </article>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
