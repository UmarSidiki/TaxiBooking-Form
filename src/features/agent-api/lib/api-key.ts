import { createHash, randomBytes } from "node:crypto";
import { connectDB } from "@/shared/db";
import ApiHit from "@/features/agent-api/model/ApiHit";
import ApiKey from "@/features/agent-api/model/ApiKey";

export function hashApiKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueApiKey(name: string) {
  await connectDB();
  const token = `tbk_${randomBytes(24).toString("hex")}`;
  const doc = await ApiKey.create({ name, prefix: token.slice(0, 8), hash: hashApiKey(token) });
  return { token, id: String(doc._id), prefix: doc.prefix };
}

export async function authenticateApiKey(header: string | null, limit = 60) {
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { ok: false as const, status: 401 };
  await connectDB();
  const key = await ApiKey.findOne({ hash: hashApiKey(token), revokedAt: null });
  if (!key) return { ok: false as const, status: 401 };
  const window = new Date().toISOString().slice(0, 16);
  const hit = await ApiHit.findOneAndUpdate(
    { keyId: String(key._id), window },
    { $inc: { count: 1 } },
    { upsert: true, new: true },
  );
  if ((hit?.count ?? 1) > limit) return { ok: false as const, status: 429 };
  return { ok: true as const, key };
}

export async function revokeApiKey(id: string) {
  await connectDB();
  await ApiKey.updateOne({ _id: id }, { $set: { revokedAt: new Date() } });
}
