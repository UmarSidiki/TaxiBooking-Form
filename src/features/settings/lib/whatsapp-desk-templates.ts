import type { NotificationSettingRow } from "@/features/notifications/lib/notification-settings";

export type DeskTemplate = {
  _id: string;
  event: string;
  audience: "customer" | "desk";
  locale: string;
  body: string;
  enabled: boolean;
};

export function templatesFromSettings(rows: NotificationSettingRow[]): DeskTemplate[] {
  return rows
    .filter(
      (row) =>
        row.channel === "whatsapp" &&
        (row.audience === "customer" || row.audience === "desk"),
    )
    .flatMap((row) =>
      Object.entries(row.templates).map(([locale, template]) => ({
        _id: row._id,
        event: row.event,
        audience: row.audience as "customer" | "desk",
        locale,
        body: template.body,
        enabled: row.enabled,
      })),
    );
}

export function legacyTemplates(rows: Array<{
  _id: unknown;
  event: string;
  audience: "customer" | "desk";
  locale: string;
  body: string;
  enabled: boolean;
}>): DeskTemplate[] {
  return rows.map((row) => ({
    _id: String(row._id),
    event: row.event,
    audience: row.audience,
    locale: row.locale,
    body: row.body,
    enabled: row.enabled,
  }));
}

export function sortTemplates(templates: DeskTemplate[]) {
  return templates.sort((a, b) => {
    if (a.event !== b.event) {
      if (a.event === "booking_confirmed") return -1;
      if (b.event === "booking_confirmed") return 1;
    }
    return a.event.localeCompare(b.event);
  });
}
