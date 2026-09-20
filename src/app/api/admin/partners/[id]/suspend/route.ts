import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { sendPartnerSuspensionEmail } from "@/features/partners/email/notification";
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

    // Calculate deletion date (30 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    partner.status = "suspended";
    partner.rejectionReason = reason;
    partner.suspendedAt = new Date();
    partner.suspendedBy = access.session.user.id;
    partner.scheduledDeletionAt = deletionDate;
    partner.isActive = false;

    await partner.save();

    // Get base URL from request headers
    const baseUrl = request.headers.get('origin') || 
                   request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                   process.env.NEXTAUTH_URL || 
                   'http://localhost:3000';

    // Send suspension email (don't wait for it)
    sendPartnerSuspensionEmail({
      name: partner.name,
      email: partner.email,
      rejectionReason: reason,
      baseUrl: baseUrl,
    }).catch((error) => {
      console.error("Failed to send suspension email:", error);
    });

    return NextResponse.json(
      {
        message: "Partner suspended successfully",
        partner,
        scheduledDeletionAt: deletionDate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error suspending partner:", error);
    return jsonError("internal_error", 500);
  }
}
