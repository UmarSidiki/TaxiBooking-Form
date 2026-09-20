import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner, type IPartnerDocument } from "@/features/partners/model";
import { sendPartnerApprovalEmail } from "@/features/partners/email/notification";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    await connectDB();

    const partner = await Partner.findById(id);

    if (!partner) return jsonError("not_found", 404);

    partner.status = "approved";
    partner.approvedAt = new Date();
    partner.approvedBy = access.session.user.id;
    partner.rejectionReason = undefined;
    partner.suspendedAt = undefined;
    partner.suspendedBy = undefined;
    partner.scheduledDeletionAt = undefined;

    // Approve all documents when partner is approved
    if (partner.documents && partner.documents.length > 0) {
      partner.documents.forEach((doc: IPartnerDocument) => {
        if (doc.status === "pending") {
          doc.status = "approved";
        }
      });
    }

    await partner.save();

    // Get base URL from request headers
    const baseUrl = request.headers.get('origin') || 
                   request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                   process.env.NEXTAUTH_URL || 
                   'http://localhost:3000';

    // Send approval email (don't wait for it)
    sendPartnerApprovalEmail({
      name: partner.name,
      email: partner.email,
      baseUrl: baseUrl,
    }).catch((error) => {
      console.error("Failed to send approval email:", error);
    });

    return NextResponse.json(
      { message: "Partner approved successfully", partner },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving partner:", error);
    return jsonError("internal_error", 500);
  }
}
