import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { sendPartnerRejectionEmail } from "@/features/partners/email/notification";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { reasonBodySchema } from "@/features/partners/schema/partner-write.schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    const parsed = await parseJsonBody(request, reasonBodySchema);
    if (!parsed.ok) return parsed.response;
    const { reason } = parsed.data;

    await connectDB();

    const partner = await Partner.findById(id);

    if (!partner) return jsonError("not_found", 404);

    partner.status = "rejected";
    partner.rejectionReason = reason;
    partner.approvedAt = undefined;
    partner.approvedBy = undefined;

    await partner.save();

    // Get base URL from request headers
    const baseUrl = request.headers.get('origin') || 
                   request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                   process.env.NEXTAUTH_URL || 
                   'http://localhost:3000';

    // Send rejection email (don't wait for it)
    sendPartnerRejectionEmail({
      name: partner.name,
      email: partner.email,
      rejectionReason: reason,
      baseUrl: baseUrl,
    }).catch((error) => {
      console.error("Failed to send rejection email:", error);
    });

    return NextResponse.json(
      { message: "Partner rejected successfully", partner },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error rejecting partner:", error);
    return jsonError("internal_error", 500);
  }
}
