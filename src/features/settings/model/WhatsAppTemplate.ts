import { Schema, model, models } from "mongoose";

export interface IWhatsAppTemplate {
  _id?: string;
  event: "booking_confirmed";
  audience: "customer" | "desk";
  locale: string;
  body: string;
  enabled: boolean;
}

const WhatsAppTemplateSchema = new Schema<IWhatsAppTemplate>(
  {
    event: { type: String, enum: ["booking_confirmed"], required: true },
    audience: { type: String, enum: ["customer", "desk"], required: true },
    locale: { type: String, required: true },
    body: { type: String, required: true },
    enabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

WhatsAppTemplateSchema.index({ audience: 1, locale: 1, enabled: 1 });

const WhatsAppTemplate =
  models.WhatsAppTemplate ||
  model<IWhatsAppTemplate>("WhatsAppTemplate", WhatsAppTemplateSchema);

export default WhatsAppTemplate;
