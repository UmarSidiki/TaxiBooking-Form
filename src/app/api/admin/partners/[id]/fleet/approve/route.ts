import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import Partner, { type IFleetRequest } from "@/models/partner/Partner";
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
    const { vehicleId } = await request.json();

    if (!partnerId) {
      return NextResponse.json(
        { success: false, message: "Partner ID is required" },
        { status: 400 }
      );
    }

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: "Vehicle ID is required" },
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

    // Find the specific fleet request
    const fleetRequest = partner.fleetRequests?.find(
      (req: IFleetRequest) => req.vehicleId === vehicleId && req.status === "pending"
    );

    if (!fleetRequest) {
      return NextResponse.json(
        { success: false, message: "No pending fleet request found for this vehicle" },
        { status: 400 }
      );
    }

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: "Requested vehicle not found" },
        { status: 404 }
      );
    }

    // Update the specific fleet request
    fleetRequest.status = "approved";
    fleetRequest.approvedAt = new Date();
    fleetRequest.approvedBy = session.user.email;

    // Set as current fleet if no current fleet exists
    if (!partner.currentFleet) {
      partner.currentFleet = vehicleId;
    }

    // Update backward compatibility fields
    partner.fleetStatus = "approved";
    partner.requestedFleet = vehicleId;
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