import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoose";
import Partner from "@/models/Partner";
import { authOptions } from "@/lib/auth/options";

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
    await connectDB();

    const partner = await Partner.findById(id);

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    partner.status = "approved";
    partner.approvedAt = new Date();
    partner.approvedBy = session.user.id;
    partner.rejectionReason = undefined;

    await partner.save();

    return NextResponse.json(
      { message: "Partner approved successfully", partner },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving partner:", error);
    return NextResponse.json(
      { error: "An error occurred while approving partner" },
      { status: 500 }
    );
  }
}
