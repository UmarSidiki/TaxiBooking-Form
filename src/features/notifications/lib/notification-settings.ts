import { connectDB } from "@/shared/db";
import NotificationSetting, {
  type INotificationSetting,
} from "@/features/notifications/model/NotificationSetting";
import type {
  NotificationAudience,
  NotificationChannel,
  NotificationTemplate,
} from "@/features/notifications/notification-types";

export type NotificationSettingRow = INotificationSetting & { _id: string };

export function templatesOf(value: unknown): Record<string, NotificationTemplate> {
  if (!value) return {};
  if (value instanceof Map) {
    return Object.fromEntries(value.entries()) as Record<string, NotificationTemplate>;
  }
  return value as Record<string, NotificationTemplate>;
}

export function normalizeSetting(row: INotificationSetting | null): NotificationSettingRow | null {
  if (!row) return null;
  return {
    ...row,
    _id: String(row._id),
    templates: templatesOf(row.templates),
  };
}

export async function listNotificationSettings(): Promise<NotificationSettingRow[]> {
  await connectDB();
  const rows = await NotificationSetting.find().lean<INotificationSetting[]>();
  return rows.map((row) => normalizeSetting(row)!).filter(Boolean);
}

export async function getNotificationSetting(
  event: string,
  channel: NotificationChannel,
  audience: NotificationAudience,
): Promise<NotificationSettingRow | null> {
  await connectDB();
  const row = await NotificationSetting.findOne({ event, channel, audience }).lean<INotificationSetting>();
  return normalizeSetting(row);
}

export async function getNotificationSettingById(id: string): Promise<NotificationSettingRow | null> {
  await connectDB();
  const row = await NotificationSetting.findById(id).lean<INotificationSetting>();
  return normalizeSetting(row);
}

export async function saveNotificationEnabled(
  event: string,
  channel: NotificationChannel,
  audience: NotificationAudience,
  enabled: boolean,
) {
  await connectDB();
  await NotificationSetting.updateOne(
    { event, channel, audience },
    { $set: { enabled } },
    { upsert: true },
  );
}

export async function saveNotificationTemplate(input: {
  event: string;
  channel: NotificationChannel;
  audience: NotificationAudience;
  locale: string;
  template: NotificationTemplate;
  enabled?: boolean;
}) {
  await connectDB();
  const { event, channel, audience, locale, template, enabled } = input;
  await NotificationSetting.updateOne(
    { event, channel, audience },
    {
      $set: {
        [`templates.${locale}`]: template,
        ...(enabled === undefined ? {} : { enabled }),
      },
    },
    { upsert: true },
  );
}

export async function saveNotificationTiming(
  event: string,
  channel: NotificationChannel,
  audience: NotificationAudience,
  timing: { hoursBefore?: number },
) {
  await connectDB();
  await NotificationSetting.updateOne(
    { event, channel, audience },
    { $set: { timing } },
    { upsert: true },
  );
}

export async function deleteNotificationSetting(id: string) {
  await connectDB();
  await NotificationSetting.findByIdAndDelete(id);
}
