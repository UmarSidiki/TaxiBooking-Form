export type WhatsAppDeskConfig = {
  enabled: boolean;
  defaultCallingCode: string;
  notifyNumbers: string[];
  companyPhone: string;
  defaultLocale: string;
};

export type WhatsAppDeskTemplate = {
  _id: string;
  audience: "customer" | "desk";
  locale: string;
  body: string;
  enabled: boolean;
};

export type WhatsAppDeskDelivery = {
  _id: string;
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
