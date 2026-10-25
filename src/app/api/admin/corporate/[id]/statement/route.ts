import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { sendCorporateStatement } from "@/features/corporate/lib/send-corporate-statement";
import { jsonError } from "@/shared/http/json-error";

const bodySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  locale: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_body", 400);
  const { id } = await params;
  const sent = await sendCorporateStatement(id, parsed.data.month, parsed.data.locale);
  if (!sent.ok) return jsonError(sent.error, 404);
  return NextResponse.json({ ok: true, emailed: sent.emailed, total: sent.total });
}
