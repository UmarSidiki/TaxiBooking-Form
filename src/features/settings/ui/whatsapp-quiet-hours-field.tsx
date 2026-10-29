"use client";

import { useTranslations } from "next-intl";

import type { WhatsAppDeskConfig } from "@/features/settings/ui/whatsapp-desk-types";
import { Switch } from "@/shared/ui/switch";

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));

export function WhatsAppQuietHoursField({
  value,
  onChange,
}: {
  value: WhatsAppDeskConfig["quietHours"];
  onChange: (value: WhatsAppDeskConfig["quietHours"]) => void;
}) {
  const t = useTranslations("Dashboard.Settings");

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <legend id="quiet-hours-label" className="text-sm font-medium">
            {t("notify_quiet_hours")}
          </legend>
          <p className="text-xs text-muted-foreground">{t("notify_quiet_hours_help")}</p>
        </div>
        <Switch
          checked={value.enabled}
          aria-labelledby="quiet-hours-label"
          onCheckedChange={(enabled) => onChange({ ...value, enabled })}
        />
      </div>
      {value.enabled ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("notify_quiet_from")}
            <select
              className="h-11 rounded-md border border-border bg-background px-3 text-base sm:text-sm"
              value={String(value.startHour)}
              onChange={(event) => onChange({ ...value, startHour: Number(event.target.value) })}
            >
              {HOURS.map((hour) => (
                <option key={hour} value={Number(hour)}>
                  {hour}:00
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("notify_quiet_to")}
            <select
              className="h-11 rounded-md border border-border bg-background px-3 text-base sm:text-sm"
              value={String(value.endHour)}
              onChange={(event) => onChange({ ...value, endHour: Number(event.target.value) })}
            >
              {HOURS.map((hour) => (
                <option key={hour} value={Number(hour)}>
                  {hour}:00
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </fieldset>
  );
}
