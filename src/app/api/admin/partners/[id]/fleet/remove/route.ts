import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import Partner, { type IFleetRequest } from "@/features/partners/model/Partner";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { vehicleIdBodySchema } from "@/features/partners/schema/partner-write.schema";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id: partnerId } = await params;
    const parsed = await parseJsonBody(request, vehicleIdBodySchema);
    if (!parsed.ok) return parsed.response;
    const { vehicleId } = parsed.data;

    await connectDB();

    // Find the partner
    const partner = await Partner.findById(partnerId);

    if (!partner) return jsonError("not_found", 404);

    // Find the specific approved fleet request
    const fleetRequestIndex = partner.fleetRequests?.findIndex(
      (req: IFleetRequest) => req.vehicleId.toString() === vehicleId && req.status === "approved"
    );

    if (fleetRequestIndex === -1 || fleetRequestIndex === undefined) {
      return jsonError("not_found", 404);
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
    return jsonError("internal_error", 500);
  }
}
