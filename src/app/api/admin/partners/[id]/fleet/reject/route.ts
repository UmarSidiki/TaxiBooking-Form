import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import Partner from "@/models/partner/Partner";
import Vehicle from "@/models/vehicle/Vehicle";
import { authOptions } from "@/lib/auth/options";
import { sendFleetRejectionEmail } from "@/controllers/email/admin/FleetNotification";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: partnerId } = await params;
    const { reason } = await request.json();

    if (!partnerId) {
      return NextResponse.json(
        { success: false, message: "Partner ID is required" },
        { status: 400 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, message: "Rejection reason is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the partner
    const partner = await Partner.findById(partnerId);

    if (!partner) {
      return NextResponse.json(
        { success: false, message: "Partner not found" },
        { status: 404 }
      );
    }

    // Check if partner has a pending fleet request
    if (partner.fleetStatus !== "pending") {
      return NextResponse.json(
        { success: false, message: "Partner does not have a pending fleet request" },
        { status: 400 }
      );
    }

    // Get vehicle info for email
    const vehicle = await Vehicle.findById(partner.requestedFleet);

    // Update partner with rejected fleet
    partner.fleetStatus = "rejected";
    partner.fleetRejectionReason = reason;
    partner.fleetApprovedAt = new Date();
    partner.fleetApprovedBy = session.user.email;

    await partner.save();

    // Send email notification to partner
    if (vehicle) {
      try {
        await sendFleetRejectionEmail({
          partnerName: partner.name,
          partnerEmail: partner.email,
          vehicleName: vehicle.name,
          vehicleCategory: vehicle.category,
          rejectionReason: reason,
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        });
      } catch (emailError) {
        console.error("Failed to send fleet rejection email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Fleet assignment rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting fleet:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}