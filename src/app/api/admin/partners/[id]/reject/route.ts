import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";
import { authOptions } from "@/lib/auth/options";
import { sendPartnerRejectionEmail } from "@/controllers/email/partners";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const partner = await Partner.findById(id);

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

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
    return NextResponse.json(
      { error: "An error occurred while rejecting partner" },
      { status: 500 }
    );
  }
}
