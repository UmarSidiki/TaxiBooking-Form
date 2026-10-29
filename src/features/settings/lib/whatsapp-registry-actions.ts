import { notificationEvent } from "@/features/notifications/notification-events";
import {
  resetNotificationTemplate,
  saveNotificationEnabled,
  saveNotificationTemplate,
  saveNotificationTiming,
} from "@/features/notifications/lib/notification-settings";
import type { WhatsAppEventAction } from "@/features/settings/schema/whatsapp.schema";

export async function updateWhatsAppEvent(input: WhatsAppEventAction) {
  const definition = notificationEvent(input.event);
  if (!definition) return { ok: false as const, error: "unknown_event" };
  if (!definition.audiences.includes(input.audience)) {
    return { ok: false as const, error: "invalid_audience" };
  }

  switch (input.action) {
    case "toggle": {
      if (!definition.channels.includes(input.channel)) {
        return { ok: false as const, error: "invalid_channel" };
      }
      await saveNotificationEnabled(
        input.event,
        input.channel,
        input.audience,
        input.enabled,
      );
      return { ok: true as const };
    }
    case "timing": {
      const channel = definition.channels.includes("whatsapp")
        ? "whatsapp"
        : definition.channels[0];
      await saveNotificationTiming(input.event, channel, input.audience, {
        hoursBefore: input.hoursBefore,
      });
      return { ok: true as const };
    }
    case "template": {
      if (!definition.channels.includes(input.channel)) {
        return { ok: false as const, error: "invalid_channel" };
      }
      await saveNotificationTemplate({
        event: input.event,
        channel: input.channel,
        audience: input.audience,
        locale: input.locale,
        template:
          input.channel === "email"
            ? { subject: input.subject ?? "", body: input.body }
            : { body: input.body },
      });
      return { ok: true as const };
    }
    case "reset": {
      if (!definition.channels.includes(input.channel)) {
        return { ok: false as const, error: "invalid_channel" };
      }
      await resetNotificationTemplate({
        event: input.event,
        channel: input.channel,
        audience: input.audience,
        locale: input.locale,
      });
      return { ok: true as const };
    }
  }
}
