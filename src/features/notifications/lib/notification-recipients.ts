import { Setting, WhatsAppConfig } from "@/features/settings/model";
import type { ISetting } from "@/features/settings/model";
import type {
  NotificationAudience,
  NotificationRecipient,
} from "@/features/notifications/notification-types";

export async function deskRecipients(): Promise<NotificationRecipient[]> {
  const [config, settings] = await Promise.all([
    WhatsAppConfig.findOne().lean(),
    Setting.findOne().select("adminEmail smtpFrom").lean<Partial<ISetting>>(),
  ]);
  const recipients: NotificationRecipient[] = (config?.notifyNumbers ?? [])
    .slice(0, 5)
    .map((phone: string) => ({ phone }));
  const operatorEmail = settings?.adminEmail?.trim() || settings?.smtpFrom?.trim();
  if (operatorEmail) recipients.push({ email: operatorEmail });
  return recipients;
}

export async function resolveNotificationRecipients(
  audiences: readonly NotificationAudience[],
  provided: Partial<Record<NotificationAudience, NotificationRecipient[]>> = {},
): Promise<Partial<Record<NotificationAudience, NotificationRecipient[]>>> {
  const resolved: Partial<Record<NotificationAudience, NotificationRecipient[]>> = {};
  for (const audience of audiences) {
    if (provided[audience]?.length) {
      resolved[audience] = provided[audience];
      continue;
    }
    if (audience === "desk") {
      resolved.desk = await deskRecipients();
    }
  }
  return resolved;
}
