export type WhatsAppDeskConfig = {
  enabled: boolean;
  defaultCallingCode: string;
  notifyNumbers: string[];
  companyPhone: string;
  defaultLocale: string;
  quietHours: { enabled: boolean; startHour: number; endHour: number };
  requireOptIn: boolean;
  sendRateLimit: number;
};

export type WhatsAppDeskTemplate = {
  _id: string;
  event?: string;
  audience: "customer" | "desk";
  locale: string;
  body: string;
  enabled: boolean;
};

export type WhatsAppDeskDelivery = {
  _id: string;
  event?: string;
  audience: "customer" | "desk";
  to: string;
  status: "sending" | "sent" | "failed";
  createdAt: string;
};

export type WhatsAppDeskData = {
  config: WhatsAppDeskConfig;
  templates: WhatsAppDeskTemplate[];
  deliveries: WhatsAppDeskDelivery[];
};

export type WhatsAppLinkView = {
  status: "needs_scan" | "waiting" | "linked" | "failed";
  qrDataUrl: string | null;
};
