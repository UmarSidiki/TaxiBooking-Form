import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/database";
import Partner, { type IFleetRequest } from "@/models/partner/Partner";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { vehicleId } = await request.json();

    if (!vehicleId) {
      return NextResponse.json(
        { error: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const partner = await Partner.findById(id);

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Remove the rejected fleet request from the array
    if (partner.fleetRequests && partner.fleetRequests.length > 0) {
      partner.fleetRequests = partner.fleetRequests.filter(
        (request: IFleetRequest) => request.vehicleId.toString() !== vehicleId
      );
    }

    await partner.save();

    return NextResponse.json({
      success: true,
      message: "Fleet request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting fleet request:", error);
    return NextResponse.json(
      { error: "Failed to delete fleet request" },
      { status: 500 }
    );
  }
}
