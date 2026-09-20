import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { partnerDocumentSchema } from "@/features/partners/schema/partner-write.schema";

export async function POST(request: NextRequest) {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, partnerDocumentSchema);
    if (!parsed.ok) return parsed.response;

    await connectDB();
    const partner = await Partner.findById(access.session.user.id);
    if (!partner) return jsonError("not_found", 404);

    partner.documents.push({
      ...parsed.data,
      status: "pending",
      uploadedAt: new Date(),
    });
    await partner.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error uploading document:", error);
    return jsonError("internal_error", 500);
  }
}
