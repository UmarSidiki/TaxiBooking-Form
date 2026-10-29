import { Schema, model, models } from "mongoose";
import type {
  NotificationAudience,
  NotificationChannel,
  NotificationTemplate,
} from "@/features/notifications/notification-types";

export interface INotificationSetting {
  _id?: string;
  event: string;
  channel: NotificationChannel;
  audience: NotificationAudience;
  enabled: boolean;
  templates: Record<string, NotificationTemplate>;
  timing?: { hoursBefore?: number };
  createdAt?: Date;
  updatedAt?: Date;
}

const TemplateSchema = new Schema<NotificationTemplate>(
  {
    subject: { type: String },
    body: { type: String, required: true },
  },
  { _id: false }
);

const NotificationSettingSchema = new Schema<INotificationSetting>(
  {
    event: { type: String, required: true },
    channel: {
      type: String,
      enum: ["whatsapp", "email"],
      required: true,
    },
    audience: {
      type: String,
      enum: ["customer", "desk", "driver", "partner"],
      required: true,
    },
    enabled: { type: Boolean, default: false },
    templates: { type: Map, of: TemplateSchema, default: {} },
    timing: {
      hoursBefore: { type: Number, min: 0, max: 168 },
    },
  },
  { timestamps: true }
);

NotificationSettingSchema.index(
  { event: 1, channel: 1, audience: 1 },
  { unique: true }
);

const NotificationSetting =
  models.NotificationSetting ||
  model<INotificationSetting>("NotificationSetting", NotificationSettingSchema);

export default NotificationSetting;
