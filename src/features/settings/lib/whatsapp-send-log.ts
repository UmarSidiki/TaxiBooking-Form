import { connectDB } from "@/shared/db";
import WhatsAppSendLog, {
  type WhatsAppSendKind,
  type WhatsAppSendStatus,
} from "@/features/settings/model/WhatsAppSendLog";

export const DEFAULT_WHATSAPP_DAILY_CAP = 300;
export const WHATSAPP_QUEUED_STALE_MS = 5 * 60 * 1000;

export type WhatsAppSendClaim =
  | { claimed: true }
  | { claimed: false; status: WhatsAppSendStatus };

export type WhatsAppSendLogView = {
  _id: string;
  at: string;
  number: string;
  kind: WhatsAppSendKind;
  status: WhatsAppSendStatus;
};

function startOfUtcDay(now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function isDuplicateKey(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

export async function countWhatsAppSendsToday(
  nowOrKind?: Date | string,
  kind?: WhatsAppSendKind,
) {
  await connectDB();
  const now = nowOrKind instanceof Date ? nowOrKind : new Date();
  const resolvedKind = typeof nowOrKind === "string" ? nowOrKind : kind;
  const filter: Record<string, unknown> = {
    status: "sent",
    createdAt: { $gte: startOfUtcDay(now) },
  };
  if (resolvedKind) filter.kind = resolvedKind;
  return WhatsAppSendLog.countDocuments(filter);
}

/**
 * Insert on the unique key wins the right to send; a duplicate reports the earlier status.
 * A queued entry older than the stale window is reclaimed atomically so a crashed attempt
 * can be retried instead of blocking the key forever. Sent entries stay idempotent.
 */
export async function claimWhatsAppSend(input: {
  idempotencyKey: string;
  jid: string;
  kind: WhatsAppSendKind;
}): Promise<WhatsAppSendClaim> {
  await connectDB();
  try {
    await WhatsAppSendLog.create({
      idempotencyKey: input.idempotencyKey,
      jid: input.jid,
      kind: input.kind,
      status: "queued",
      attempts: 1,
    });
    return { claimed: true };
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const now = new Date();
    const reclaimed = await WhatsAppSendLog.findOneAndUpdate(
      {
        idempotencyKey: input.idempotencyKey,
        status: "queued",
        createdAt: { $lt: new Date(now.getTime() - WHATSAPP_QUEUED_STALE_MS) },
      },
      {
        $set: { status: "queued", error: "stale_queued", createdAt: now },
        $inc: { attempts: 1 },
      },
      { new: true, projection: { _id: 1 } },
    ).lean();
    if (reclaimed) return { claimed: true };
    const previous = await WhatsAppSendLog.findOne({
      idempotencyKey: input.idempotencyKey,
    })
      .select("status")
      .lean<{ status: WhatsAppSendStatus }>();
    return { claimed: false, status: previous?.status ?? "queued" };
  }
}

export async function markWhatsAppSend(
  idempotencyKey: string,
  status: WhatsAppSendStatus,
  detail: { waMessageId?: string; error?: string } = {},
) {
  await connectDB();
  await WhatsAppSendLog.updateOne(
    { idempotencyKey },
    {
      $set: {
        status,
        ...(detail.waMessageId ? { waMessageId: detail.waMessageId } : {}),
        ...(detail.error ? { error: detail.error } : {}),
      },
    },
  );
}

export async function markWhatsAppFallback(idempotencyKey: string) {
  await connectDB();
  await WhatsAppSendLog.updateOne(
    { idempotencyKey, status: { $nin: ["sent", "capped"] } },
    { $set: { status: "fallback" } },
  );
}

export function maskWhatsAppJid(jid: string) {
  const digits = (jid.split("@")[0] ?? "").replace(/\D/g, "");
  const last = digits.slice(-4);
  return last ? `••••${last}` : "—";
}

export async function listRecentWhatsAppSends(limit = 50): Promise<WhatsAppSendLogView[]> {
  await connectDB();
  const rows = await WhatsAppSendLog.find()
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 50))
    .lean<
      Array<{
        _id: unknown;
        jid: string;
        kind: WhatsAppSendKind;
        status: WhatsAppSendStatus;
        createdAt?: Date;
      }>
    >();
  return rows.map((row) => ({
    _id: String(row._id),
    at: (row.createdAt ?? new Date()).toISOString(),
    number: maskWhatsAppJid(row.jid),
    kind: row.kind,
    status: row.status,
  }));
}
