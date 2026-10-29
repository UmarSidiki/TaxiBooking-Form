import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { RefundRequest } from "@/features/booking/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  await connectDB();
  const { id } = await params;
  const refundRequest = await RefundRequest.findById(id);
  if (!refundRequest) return jsonError("not_found", 404);

  refundRequest.status = "rejected";
  await refundRequest.save();

  return NextResponse.json({ ok: true, status: refundRequest.status, refundRequest });
}
