"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Item = { _id: string; action: string; actorRole: string; createdAt: string };

const KNOWN = new Set([
  "assigned",
  "claimed",
  "started",
  "completed",
  "no_show",
  "cancelled",
  "edited",
  "approved",
  "quoted",
  "confirmed",
  "declined",
]);

export function AdminRideActivity({ bookingId }: { bookingId: string }) {
  const t = useTranslations();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/bookings/${bookingId}/activity`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.success) {
          setError(true);
          return;
        }
        setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return (
    <section className="rounded-md border border-border bg-card p-4" aria-label={t("Dashboard.Rides.activity")}>
      <h3 className="mb-3 font-semibold text-foreground">{t("Dashboard.Rides.activity")}</h3>
      {items === null && !error ? <p role="status">{t("Dashboard.Rides.activity-loading")}</p> : null}
      {error ? <p role="alert">{t("Dashboard.Rides.edit-failed")}</p> : null}
      {items && items.length === 0 ? <p className="text-sm text-muted-foreground">{t("Dashboard.Rides.activity-empty")}</p> : null}
      {items && items.length > 0 ? (
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item._id} className="flex items-baseline justify-between gap-3">
              <span>
                {KNOWN.has(item.action)
                  ? t(`Dashboard.Rides.activity-${item.action}`)
                  : item.action}
              </span>
              <time className="text-muted-foreground" dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
