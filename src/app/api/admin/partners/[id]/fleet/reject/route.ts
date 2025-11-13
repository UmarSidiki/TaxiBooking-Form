import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import Partner, { type IFleetRequest } from "@/models/partner/Partner";
import Vehicle from "@/models/vehicle/Vehicle";
import { authOptions } from "@/lib/auth/options";
import { sendFleetRejectionEmail } from "@/controllers/email/admin/FleetNotification";
import { getBaseUrl } from "@/lib/get-base-url";

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
    const { reason, vehicleId } = await request.json();

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

    // Get vehicle info for email
    const vehicle = await Vehicle.findById(vehicleId);

    // Update the specific fleet request
    fleetRequest.status = "rejected";
    fleetRequest.rejectionReason = reason;
    fleetRequest.approvedAt = new Date();
    fleetRequest.approvedBy = session.user.email;

    // Update backward compatibility fields
    partner.fleetStatus = "rejected";
    partner.fleetRejectionReason = reason;
    partner.fleetApprovedAt = new Date();
    partner.fleetApprovedBy = session.user.email;

    await partner.save();

    // Send email notification to partner
    if (vehicle) {
      try {
        const baseUrl = getBaseUrl(request);
        
        await sendFleetRejectionEmail({
          partnerName: partner.name,
          partnerEmail: partner.email,
          vehicleName: vehicle.name,
          vehicleCategory: vehicle.category,
          rejectionReason: reason,
          baseUrl,
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