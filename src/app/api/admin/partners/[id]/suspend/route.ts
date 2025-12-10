import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";
import { authOptions } from "@/lib/auth/options";
import { sendPartnerSuspensionEmail } from "@/controllers/email/partners";

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
        { error: "Suspension reason is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const partner = await Partner.findById(id);

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Calculate deletion date (30 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    partner.status = "suspended";
    partner.rejectionReason = reason;
    partner.suspendedAt = new Date();
    partner.suspendedBy = session.user.id;
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
    return NextResponse.json(
      { error: "An error occurred while suspending partner" },
      { status: 500 }
    );
  }
}
