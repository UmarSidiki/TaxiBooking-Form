import { Setting } from "@/features/settings/model";
import type { ISetting } from "@/features/settings/model";
import {
  listNotificationSettings,
  saveNotificationEnabled,
} from "@/features/notifications/lib/notification-settings";

export const whatsappToggleKeys = [
  "whatsappTplAssigned",
  "whatsappTplAvailable",
  "whatsappTplChanged",
  "whatsappTplCancelled",
  "whatsappTplReminder",
  "whatsappTplSettlement",
] as const;

export type WhatsAppToggleKey = (typeof whatsappToggleKeys)[number];

const TOGGLE_EVENTS: Record<WhatsAppToggleKey, { event: string; legacy?: keyof ISetting }> = {
  whatsappTplAssigned: { event: "ride_assigned", legacy: "whatsappTplAssigned" },
  whatsappTplAvailable: { event: "ride_available", legacy: "whatsappTplAvailable" },
  whatsappTplChanged: { event: "ride_changed", legacy: "whatsappTplChanged" },
  whatsappTplCancelled: { event: "ride_cancelled", legacy: "whatsappTplChanged" },
  whatsappTplReminder: { event: "pickup_reminder", legacy: "whatsappTplReminder" },
  whatsappTplSettlement: { event: "partner_settlement", legacy: "whatsappTplSettlement" },
};

const TOGGLE_AUDIENCES: Record<WhatsAppToggleKey, readonly ("driver" | "partner")[]> = {
  whatsappTplAssigned: ["driver", "partner"],
  whatsappTplAvailable: ["driver", "partner"],
  whatsappTplChanged: ["driver", "partner"],
  whatsappTplCancelled: ["driver", "partner"],
  whatsappTplReminder: ["driver", "partner"],
  whatsappTplSettlement: ["partner"],
};

export async function readWhatsAppToggleFlags(): Promise<Record<WhatsAppToggleKey, boolean>> {
  const [rows, settings] = await Promise.all([
    listNotificationSettings(),
    Setting.findOne().lean<Partial<ISetting>>(),
  ]);
  const flags = {} as Record<WhatsAppToggleKey, boolean>;
  for (const key of whatsappToggleKeys) {
    const { event, legacy } = TOGGLE_EVENTS[key];
    const row = rows.find((item) => item.channel === "whatsapp" && item.event === event);
    flags[key] = row ? row.enabled : Boolean(legacy ? settings?.[legacy] : false);
  }
  return flags;
}

export async function writeWhatsAppToggleFlags(flags: Record<WhatsAppToggleKey, boolean>) {
  await Promise.all(
    whatsappToggleKeys.flatMap((key) =>
      TOGGLE_AUDIENCES[key].map((audience) =>
        saveNotificationEnabled(TOGGLE_EVENTS[key].event, "whatsapp", audience, flags[key]),
      ),
    ),
  );
}
