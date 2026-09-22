import { Schema, model, models } from "mongoose";

export type WhatsAppLinkStatus = "needs_scan" | "waiting" | "linked" | "failed";

export interface IWhatsAppLink {
  _id: string;
  status: WhatsAppLinkStatus;
  qrDataUrl: string | null;
  updatedAt: Date;
}

const WhatsAppLinkSchema = new Schema<IWhatsAppLink>(
  {
    _id: { type: String },
    status: {
      type: String,
      enum: ["needs_scan", "waiting", "linked", "failed"],
      required: true,
    },
    qrDataUrl: { type: String, default: null },
  },
  { timestamps: true }
);

const WhatsAppLink = models.WhatsAppLink || model<IWhatsAppLink>("WhatsAppLink", WhatsAppLinkSchema);

export default WhatsAppLink;
