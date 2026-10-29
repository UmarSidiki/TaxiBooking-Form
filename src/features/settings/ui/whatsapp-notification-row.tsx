"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { RegistryEventRow } from "@/features/settings/lib/whatsapp-registry-types";
import { apiPatch } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";

const CHANNELS = { whatsapp: "notify_channel_whatsapp", email: "notify_channel_email" } as const;

export function WhatsAppNotificationRow({
  row,
  onEdit,
  onChanged,
}: {
  row: RegistryEventRow;
  onEdit: (row: RegistryEventRow) => void;
  onChanged: () => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const id = `${row.key}-${row.audience}`;
  const nameId = `notify-name-${id}`;
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const [error, setError] = useState(false);
  const [hours, setHours] = useState(String(row.timing?.hoursBefore ?? 24));
  const [timingNotice, setTimingNotice] = useState<string | null>(null);

  const name = t(`notify_event_${row.key}_name`);
  const help = t(`notify_event_${row.key}_help`);

  const toggle = async (channel: string, enabled: boolean) => {
    setLocal((prev) => ({ ...prev, [channel]: enabled }));
    setError(false);
    try {
      await apiPatch("/api/settings/whatsapp/events", {
        action: "toggle",
        event: row.key,
        audience: row.audience,
        channel,
        enabled,
      });
      onChanged();
    } catch {
      setLocal((prev) => ({ ...prev, [channel]: !enabled }));
      setError(true);
    }
  };

  const saveTiming = async () => {
    const value = Number(hours);
    if (!Number.isInteger(value) || value < 0 || value > 168) return;
    setTimingNotice(null);
    try {
      await apiPatch("/api/settings/whatsapp/events", {
        action: "timing",
        event: row.key,
        audience: row.audience,
        hoursBefore: value,
      });
      setTimingNotice(t("notify_timing_saved"));
      onChanged();
    } catch {
      setTimingNotice(t("notify_switch_failed"));
    }
  };

  return (
    <li
      id={`notify-row-${id}`}
      className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p id={nameId} className="text-sm font-medium">
          {name}
        </p>
        <p className="text-xs text-pretty text-muted-foreground">{help}</p>
        {row.timing ? (
          <div className="mt-1 flex flex-wrap items-end gap-2">
            <label htmlFor={`notify-hours-${id}`} className="text-xs font-medium">
              {t("notify_hours_before")}
            </label>
            <Input
              id={`notify-hours-${id}`}
              name={`hours-${id}`}
              type="number"
              min={0}
              max={168}
              inputMode="numeric"
              className="h-11 w-20"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              onBlur={() => void saveTiming()}
            />
            <span className="rounded-full bg-background px-2 py-1 text-xs text-muted-foreground">
              {t("notify_recipient")}: {t(`notify_group_${row.audience}`)}
            </span>
            {timingNotice ? (
              <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
                {timingNotice}
              </span>
            ) : null}
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-xs text-destructive">
            {t("notify_switch_failed")}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {row.channels.map(({ channel }) => {
          const labelId = `notify-channel-${id}-${channel}`;
          const enabled = local[channel] ?? row.channels.find((item) => item.channel === channel)?.enabled ?? false;
          return (
            <label
              key={channel}
              htmlFor={`notify-switch-${id}-${channel}`}
              className="flex min-h-11 items-center gap-2 text-xs font-medium"
            >
              <Switch
                id={`notify-switch-${id}-${channel}`}
                checked={enabled}
                aria-labelledby={`${nameId} ${labelId}`}
                aria-describedby={channel === "email" ? `notify-email-hint-${id}` : undefined}
                onCheckedChange={(checked) => void toggle(channel, checked)}
              />
              <span id={labelId}>{t(CHANNELS[channel])}</span>
              {channel === "email" ? (
                <span id={`notify-email-hint-${id}`} className="sr-only">
                  {t("notify_email_soon")}
                </span>
              ) : null}
            </label>
          );
        })}
        <Button type="button" variant="outline" className="h-11" onClick={() => onEdit(row)}>
          {t("notify_edit")}
        </Button>
      </div>
    </li>
  );
}
