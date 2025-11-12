import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import Partner from "@/models/partner/Partner";
import Vehicle from "@/models/vehicle/Vehicle";
import { authOptions } from "@/lib/auth/options";
import { sendFleetApprovalEmail } from "@/controllers/email/admin/FleetNotification";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const partnerId = id;

    if (!partnerId) {
      return NextResponse.json(
        { success: false, message: "Partner ID is required" },
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

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(partner.requestedFleet);

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: "Requested vehicle not found" },
        { status: 404 }
      );
    }

    // Update partner with approved fleet
    partner.fleetStatus = "approved";
    partner.fleetApprovedAt = new Date();
    partner.fleetApprovedBy = session.user.email;

    await partner.save();

    // Send email notification to partner
    try {
      await sendFleetApprovalEmail({
        partnerName: partner.name,
        partnerEmail: partner.email,
        vehicleName: vehicle.name,
        vehicleCategory: vehicle.category,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      });
    } catch (emailError) {
      console.error("Failed to send fleet approval email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Fleet assignment approved successfully",
    });
  } catch (error) {
    console.error("Error approving fleet:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}