import { Schema, model, models } from "mongoose";

export interface IWhatsAppDelivery {
  _id?: string;
  bookingId: string;
  audience: "customer" | "desk";
  to: string;
  status: "sending" | "sent" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}

const WhatsAppDeliverySchema = new Schema<IWhatsAppDelivery>(
  {
    bookingId: { type: String, required: true },
    audience: { type: String, enum: ["customer", "desk"], required: true },
    to: { type: String, required: true },
    status: {
      type: String,
      enum: ["sending", "sent", "failed"],
      required: true,
    },
  },
  { timestamps: true }
);

WhatsAppDeliverySchema.index(
  { bookingId: 1, audience: 1, to: 1 },
  { unique: true }
);
WhatsAppDeliverySchema.index({ createdAt: -1 });

const WhatsAppDelivery =
  models.WhatsAppDelivery ||
  model<IWhatsAppDelivery>("WhatsAppDelivery", WhatsAppDeliverySchema);

export default WhatsAppDelivery;
