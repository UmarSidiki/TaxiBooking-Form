import { Schema, model, models } from "mongoose";

export type WhatsAppSendKind =
  | "otp"
  | "notification"
  | "test"
  | "verification"
  | "other";

export type WhatsAppSendStatus =
  | "queued"
  | "sent"
  | "failed"
  | "fallback"
  | "capped";

export interface IWhatsAppSendLog {
  _id?: string;
  idempotencyKey: string;
  jid: string;
  kind: WhatsAppSendKind;
  status: WhatsAppSendStatus;
  waMessageId?: string;
  error?: string;
  attempts: number;
  createdAt: Date;
}

const TTL_SECONDS = 60 * 60 * 24 * 90;

const WhatsAppSendLogSchema = new Schema<IWhatsAppSendLog>({
  idempotencyKey: { type: String, required: true, unique: true },
  jid: { type: String, required: true },
  kind: {
    type: String,
    enum: ["otp", "notification", "test", "verification", "other"],
    required: true,
  },
  status: {
    type: String,
    enum: ["queued", "sent", "failed", "fallback", "capped"],
    required: true,
  },
  waMessageId: { type: String },
  error: { type: String, maxlength: 120 },
  attempts: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now, expires: TTL_SECONDS },
});

WhatsAppSendLogSchema.index({ createdAt: -1 });
WhatsAppSendLogSchema.index({ status: 1, createdAt: -1 });

const WhatsAppSendLog =
  models.WhatsAppSendLog ||
  model<IWhatsAppSendLog>("WhatsAppSendLog", WhatsAppSendLogSchema);

export default WhatsAppSendLog;
