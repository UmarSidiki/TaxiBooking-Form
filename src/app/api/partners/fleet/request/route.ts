import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import Partner, { type IFleetRequest } from "@/models/partner/Partner";
import Vehicle from "@/models/vehicle/Vehicle";
import { authOptions } from "@/lib/auth/options";
import { sendFleetRequestNotificationEmail } from "@/controllers/email/admin/FleetNotification";
import { getBaseUrl } from "@/lib/get-base-url";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { vehicleId } = await request.json();

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the partner
    const partner = await Partner.findOne({ email: session.user.email });

    if (!partner) {
      return NextResponse.json(
        { success: false, message: "Partner not found" },
        { status: 404 }
      );
    }

    // Check if partner is approved
    if (partner.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "Only approved partners can request fleet assignment" },
        { status: 403 }
      );
    }

    // Check if partner already has a pending fleet request for this vehicle
    const existingRequest = partner.fleetRequests?.find(
      (req: IFleetRequest) => req.vehicleId.toString() === vehicleId && req.status === "pending"
    );
    
    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: "You already have a pending request for this vehicle" },
        { status: 400 }
      );
    }

    // Initialize fleetRequests array if it doesn't exist
    if (!partner.fleetRequests) {
      partner.fleetRequests = [];
    }

    // Add new fleet request
    partner.fleetRequests.push({
      vehicleId,
      status: "pending",
      requestedAt: new Date(),
    });

    await partner.save();

    // Send email notification to admin
    try {
      // Fetch vehicle details for the email
      const vehicle = await Vehicle.findById(vehicleId);
      const baseUrl = getBaseUrl(request);
      
      await sendFleetRequestNotificationEmail({
        partnerName: partner.name,
        partnerEmail: partner.email,
        vehicleName: vehicle?.name || 'Unknown Vehicle',
        vehicleCategory: vehicle?.category || 'Unknown',
        baseUrl,
      });
    } catch (emailError) {
      console.error("Failed to send fleet request notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Fleet assignment request submitted successfully",
    });
  } catch (error) {
    console.error("Error requesting fleet:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}