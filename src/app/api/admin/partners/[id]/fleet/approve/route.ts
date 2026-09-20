import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import Partner, { type IFleetRequest } from "@/features/partners/model/Partner";
import Vehicle from "@/features/fleet/model/Vehicle";
import { sendFleetApprovalEmail } from "@/features/partners/email/fleet-notification";
import { getBaseUrl } from "@/shared/lib/get-base-url";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { vehicleIdBodySchema } from "@/features/partners/schema/partner-write.schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, vehicleIdBodySchema);
    if (!parsed.ok) return parsed.response;
    const { vehicleId } = parsed.data;
    const partnerId = id;

    await connectDB();

    // Find the partner
    const partner = await Partner.findById(partnerId);

    if (!partner) return jsonError("not_found", 404);

    // Find the specific fleet request
    const fleetRequest = partner.fleetRequests?.find(
      (req: IFleetRequest) => req.vehicleId.toString() === vehicleId && req.status === "pending"
    );

    if (!fleetRequest) return jsonError("not_found", 404);

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) return jsonError("not_found", 404);

    // Update the specific fleet request
    fleetRequest.status = "approved";
    fleetRequest.approvedAt = new Date();
    fleetRequest.approvedBy = access.session.user.email;

    // Set as current fleet if no current fleet exists
    if (!partner.currentFleet) {
      partner.currentFleet = vehicleId;
    }

    // Update backward compatibility fields
    partner.fleetStatus = "approved";
    partner.requestedFleet = vehicleId;
    partner.fleetApprovedAt = new Date();
    partner.fleetApprovedBy = access.session.user.email;

    await partner.save();

    // Send email notification to partner
    try {
      const baseUrl = getBaseUrl(request);
      
      await sendFleetApprovalEmail({
        partnerName: partner.name,
        partnerEmail: partner.email,
        vehicleName: vehicle.name,
        vehicleCategory: vehicle.category,
        baseUrl,
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
    return jsonError("internal_error", 500);
  }
}