import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { RefundRequest } from "@/features/booking/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET(_request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  await connectDB();
  const requests = await RefundRequest.find().sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ ok: true, requests });
}
