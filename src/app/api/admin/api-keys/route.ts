import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { issueApiKey, revokeApiKey } from "@/features/agent-api/lib/api-key";

const schema = z.object({ name: z.string().trim().min(1).max(80), revokeId: z.string().optional() });

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  if (parsed.data.revokeId) {
    await revokeApiKey(parsed.data.revokeId);
    return NextResponse.json({ ok: true });
  }
  const issued = await issueApiKey(parsed.data.name);
  return NextResponse.json(issued);
}
