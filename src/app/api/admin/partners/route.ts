import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

const partnerListQuerySchema = z.object({
  status: z
    .enum(["pending", "approved", "rejected", "suspended"])
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    await connectDB();
    const parsed = partnerListQuerySchema.safeParse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });
    if (!parsed.success) return jsonError("invalid_body", 400);

    const query = parsed.data.status ? { status: parsed.data.status } : {};
    const partners = await Partner.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(500);

    return NextResponse.json({ partners }, { status: 200 });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return jsonError("internal_error", 500);
  }
}
