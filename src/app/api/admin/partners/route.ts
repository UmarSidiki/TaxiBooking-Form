import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { omitPartnerDocumentFileData } from "@/features/partners/lib/to-admin-partner";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

const partnerListQuerySchema = z.object({
  status: z
    .enum(["pending", "active", "approved", "rejected", "suspended"])
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
      .select("-password -documents.fileData")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return NextResponse.json(
      { partners: partners.map((partner) => omitPartnerDocumentFileData(partner)) },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching partners:", error);
    return jsonError("internal_error", 500);
  }
}
