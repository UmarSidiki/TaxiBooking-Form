import { Schema, model, models } from "mongoose";

export interface IWhatsAppConfig {
  _id?: string;
  enabled: boolean;
  defaultCallingCode: string;
  notifyNumbers: string[];
  companyPhone: string;
  defaultLocale: string;
  quietHours: { enabled: boolean; startHour: number; endHour: number };
  requireOptIn: boolean;
  sendRateLimit: number;
}

const WhatsAppConfigSchema = new Schema<IWhatsAppConfig>(
  {
    enabled: { type: Boolean, default: false },
    defaultCallingCode: { type: String, default: "" },
    notifyNumbers: { type: [String], default: [] },
    companyPhone: { type: String, default: "" },
    defaultLocale: { type: String, default: "en" },
    quietHours: {
      enabled: { type: Boolean, default: false },
      startHour: { type: Number, default: 22, min: 0, max: 23 },
      endHour: { type: Number, default: 7, min: 0, max: 23 },
    },
    requireOptIn: { type: Boolean, default: true },
    sendRateLimit: { type: Number, default: 0, min: 0, max: 120 },
  },
  { timestamps: true }
);

const WhatsAppConfig =
  models.WhatsAppConfig || model<IWhatsAppConfig>("WhatsAppConfig", WhatsAppConfigSchema);

export default WhatsAppConfig;
