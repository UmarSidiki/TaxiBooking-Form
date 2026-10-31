import { connectDB } from "@/shared/db";
import WhatsAppSendLog, {
  type WhatsAppSendKind,
  type WhatsAppSendStatus,
} from "@/features/settings/model/WhatsAppSendLog";

export const DEFAULT_WHATSAPP_DAILY_CAP = 300;

function startOfUtcDay(now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export async function countWhatsAppSendsToday(now = new Date()) {
  await connectDB();
  return WhatsAppSendLog.countDocuments({
    status: "sent",
    createdAt: { $gte: startOfUtcDay(now) },
  });
}

export async function recordWhatsAppSend(input: {
  jid: string;
  kind: WhatsAppSendKind;
  status: WhatsAppSendStatus;
  waMessageId?: string;
  error?: string;
}) {
  await connectDB();
  await WhatsAppSendLog.create({
    idempotencyKey: `${input.kind}:${input.jid}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2)}`,
    jid: input.jid,
    kind: input.kind,
    status: input.status,
    ...(input.waMessageId ? { waMessageId: input.waMessageId } : {}),
    ...(input.error ? { error: input.error } : {}),
    attempts: 1,
  });
}
