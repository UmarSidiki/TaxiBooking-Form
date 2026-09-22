import { Schema, model, models } from "mongoose";

export interface IWhatsAppConfig {
  _id?: string;
  enabled: boolean;
  defaultCallingCode: string;
  notifyNumbers: string[];
  companyPhone: string;
  defaultLocale: string;
}

const WhatsAppConfigSchema = new Schema<IWhatsAppConfig>(
  {
    enabled: { type: Boolean, default: false },
    defaultCallingCode: { type: String, default: "" },
    notifyNumbers: { type: [String], default: [] },
    companyPhone: { type: String, default: "" },
    defaultLocale: { type: String, default: "en" },
  },
  { timestamps: true }
);

const WhatsAppConfig =
  models.WhatsAppConfig || model<IWhatsAppConfig>("WhatsAppConfig", WhatsAppConfigSchema);

export default WhatsAppConfig;
