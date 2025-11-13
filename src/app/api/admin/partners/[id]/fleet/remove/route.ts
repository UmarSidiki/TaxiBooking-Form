import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import Partner, { type IFleetRequest } from "@/models/partner/Partner";
import { authOptions } from "@/lib/auth/options";

export async function DELETE(
  request: Request,
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

    // Find the specific approved fleet request
    const fleetRequestIndex = partner.fleetRequests?.findIndex(
      (req: IFleetRequest) => req.vehicleId.toString() === vehicleId && req.status === "approved"
    );

    if (fleetRequestIndex === -1 || fleetRequestIndex === undefined) {
      return NextResponse.json(
        { success: false, message: "No approved fleet found for this vehicle" },
        { status: 400 }
      );
    }

    // Remove the fleet request
    partner.fleetRequests.splice(fleetRequestIndex, 1);

    // Clear currentFleet if it matches this vehicle
    if (partner.currentFleet?.toString() === vehicleId) {
      // Set currentFleet to another approved fleet if exists
      const anotherApprovedFleet = partner.fleetRequests?.find(
        (req: IFleetRequest) => req.status === "approved"
      );
      partner.currentFleet = anotherApprovedFleet?.vehicleId;
    }

    // Update backward compatibility fields
    if (partner.requestedFleet?.toString() === vehicleId && partner.fleetStatus === "approved") {
      // Check if there are other approved fleets
      const hasOtherApprovedFleets = partner.fleetRequests?.some(
        (req: IFleetRequest) => req.status === "approved"
      );
      
      if (!hasOtherApprovedFleets) {
        partner.requestedFleet = undefined;
        partner.fleetStatus = "none";
        partner.fleetApprovedAt = undefined;
        partner.fleetApprovedBy = undefined;
      }
    }

    await partner.save();

    return NextResponse.json({
      success: true,
      message: "Fleet removed successfully from partner",
    });
  } catch (error) {
    console.error("Error removing fleet from partner:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
