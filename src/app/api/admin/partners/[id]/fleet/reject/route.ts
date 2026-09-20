import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import Partner, { type IFleetRequest } from "@/features/partners/model/Partner";
import Vehicle from "@/features/fleet/model/Vehicle";
import { sendFleetRejectionEmail } from "@/features/partners/email/fleet-notification";
import { getBaseUrl } from "@/shared/lib/get-base-url";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { fleetRejectBodySchema } from "@/features/partners/schema/partner-write.schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id: partnerId } = await params;
    const parsed = await parseJsonBody(request, fleetRejectBodySchema);
    if (!parsed.ok) return parsed.response;
    const { reason, vehicleId } = parsed.data;

    await connectDB();

    // Find the partner
    const partner = await Partner.findById(partnerId);

    if (!partner) return jsonError("not_found", 404);

    // Find the specific fleet request
    const fleetRequest = partner.fleetRequests?.find(
      (req: IFleetRequest) => req.vehicleId.toString() === vehicleId && req.status === "pending"
    );

    if (!fleetRequest) return jsonError("not_found", 404);

    // Get vehicle info for email
    const vehicle = await Vehicle.findById(vehicleId);

    // Update the specific fleet request
    fleetRequest.status = "rejected";
    fleetRequest.rejectionReason = reason;
    fleetRequest.approvedAt = new Date();
    fleetRequest.approvedBy = access.session.user.email;

    // Update backward compatibility fields
    partner.fleetStatus = "rejected";
    partner.fleetRejectionReason = reason;
    partner.fleetApprovedAt = new Date();
    partner.fleetApprovedBy = access.session.user.email;

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
    return jsonError("internal_error", 500);
  }
}