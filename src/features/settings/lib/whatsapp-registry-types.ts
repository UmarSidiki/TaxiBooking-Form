import type {
  NotificationAudience,
  NotificationChannel,
  NotificationLocale,
} from "@/features/notifications/notification-types";

export type RegistryChannelView = {
  channel: NotificationChannel;
  enabled: boolean;
};

export type RegistryTemplateView = {
  body: string;
  custom: boolean;
};

export type RegistryEmailTemplateView = {
  subject: string;
  body: string;
  custom: boolean;
};

export type RegistryEventRow = {
  key: string;
  audience: NotificationAudience;
  channels: RegistryChannelView[];
  variables: string[];
  templates: Record<NotificationLocale, RegistryTemplateView>;
  defaults: Record<NotificationLocale, string>;
  emailTemplates: Record<NotificationLocale, RegistryEmailTemplateView>;
  emailDefaults: Record<NotificationLocale, RegistryEmailTemplateView>;
  timing: { hoursBefore: number; custom: boolean } | null;
};

export type RegistryConfig = {
  enabled: boolean;
  defaultCallingCode: string;
  notifyNumbers: string[];
  companyPhone: string;
  defaultLocale: string;
  quietHours: { enabled: boolean; startHour: number; endHour: number };
  requireOptIn: boolean;
  sendRateLimit: number;
};

export type RegistryDelivery = {
  _id: string;
  event?: string;
  audience: "customer" | "desk";
  to: string;
  status: "sending" | "sent" | "failed";
  createdAt: string;
};

export type WhatsAppRegistryData = {
  config: RegistryConfig;
  events: RegistryEventRow[];
  deliveries: RegistryDelivery[];
};
