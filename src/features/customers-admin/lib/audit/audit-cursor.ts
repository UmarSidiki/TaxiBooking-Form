import { z } from "zod";

import { isObjectIdString } from "@/features/customers-admin/lib/object-id";

const cursorPayloadSchema = z.object({
  a: z.string().min(1),
  i: z.string().refine(isObjectIdString),
});

export type AdminAuditCursor = { at: Date; id: string };

export function encodeAdminAuditCursor(at: Date, id: string): string {
  return Buffer.from(JSON.stringify({ a: at.toISOString(), i: id }), "utf8").toString(
    "base64url",
  );
}

export function decodeAdminAuditCursor(raw: string): AdminAuditCursor | null {
  try {
    const body: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    const parsed = cursorPayloadSchema.safeParse(body);
    if (!parsed.success) return null;
    const at = new Date(parsed.data.a);
    if (Number.isNaN(at.getTime())) return null;
    return { at, id: parsed.data.i };
  } catch {
    return null;
  }
}
