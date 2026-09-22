import { Schema, model, models } from "mongoose";

export interface IWhatsAppAuth {
  name: string;
  payload: string;
}

const WhatsAppAuthSchema = new Schema<IWhatsAppAuth>({
  name: { type: String, required: true, unique: true },
  payload: { type: String, required: true },
});

const WhatsAppAuth = models.WhatsAppAuth || model<IWhatsAppAuth>("WhatsAppAuth", WhatsAppAuthSchema);

export default WhatsAppAuth;
