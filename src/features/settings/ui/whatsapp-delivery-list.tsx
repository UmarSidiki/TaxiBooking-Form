"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { RegistryDelivery } from "@/features/settings/lib/whatsapp-registry-types";

const STATUSES = ["sending", "sent", "failed"] as const;
const selectClass =
  "h-11 min-w-0 rounded-md border border-border bg-background px-3 text-base sm:text-sm";

export function WhatsAppDeliveryList({ deliveries }: { deliveries: RegistryDelivery[] }) {
  const t = useTranslations("Dashboard.Settings");
  const locale = useLocale();
  const [event, setEvent] = useState("all");
  const [status, setStatus] = useState("all");
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  const events = useMemo(
    () =>
      Array.from(
        new Set(
          deliveries
            .map((item) => item.event)
            .filter((key): key is string => Boolean(key)),
        ),
      ),
    [deliveries],
  );
  const filtered = deliveries.filter(
    (item) =>
      (event === "all" || item.event === event) &&
      (status === "all" || item.status === status),
  );
  const eventName = (key?: string) => {
    if (!key) return "—";
    return t.has(`notify_event_${key}_name`) ? t(`notify_event_${key}_name`) : key;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <div>
          <label htmlFor="notify-filter-event" className="mb-1 block text-xs font-medium">
            {t("notify_filter_event")}
          </label>
          <select
            id="notify-filter-event"
            className={selectClass}
            value={event}
            onChange={(changeEvent) => setEvent(changeEvent.target.value)}
          >
            <option value="all">{t("notify_all_events")}</option>
            {events.map((key) => (
              <option key={key} value={key}>
                {eventName(key)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="notify-filter-status" className="mb-1 block text-xs font-medium">
            {t("notify_filter_status")}
          </label>
          <select
            id="notify-filter-status"
            className={selectClass}
            value={status}
            onChange={(changeEvent) => setStatus(changeEvent.target.value)}
          >
            <option value="all">{t("notify_all_statuses")}</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`whatsapp_status_${value}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {deliveries.length === 0
            ? t("whatsapp_deliveries_empty")
            : t("notify_filter_empty")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {filtered.map((item) => (
            <li
              key={item._id}
              className="flex min-w-0 flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0 truncate" translate="no">
                {item.to}
              </span>
              <span className="text-muted-foreground">
                {eventName(item.event)}
                {" · "}
                {item.audience === "customer"
                  ? t("whatsapp_audience_customer")
                  : t("whatsapp_audience_desk")}
                {" · "}
                {t(`whatsapp_status_${item.status}`)}
                {" · "}
                <span className="tabular-nums">{format.format(new Date(item.createdAt))}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
