import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/shared/db";
import Partner, { type IFleetRequest } from "@/features/partners/model/Partner";
import Vehicle from "@/features/fleet/model/Vehicle";
import { authOptions } from "@/features/auth";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { vehicleIdBodySchema } from "@/features/partners/schema/partner-write.schema";
import { sendFleetRequestNotificationEmail } from "@/features/partners/email/fleet-notification";
import { getBaseUrl } from "@/shared/lib/get-base-url";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return jsonError("unauthorized", 401);
    }

    const parsed = await parseJsonBody(request, vehicleIdBodySchema);
    if (!parsed.ok) return parsed.response;
    const { vehicleId } = parsed.data;

    await connectDB();

    // Find the partner
    const partner = await Partner.findOne({ email: session.user.email });

    if (!partner) {
      return jsonError("not_found", 404);
    }

    // Check if partner is approved
    if (partner.status !== "approved") {
      return jsonError("forbidden", 403);
    }

    // Check if partner already has a pending fleet request for this vehicle
    const existingRequest = partner.fleetRequests?.find(
      (req: IFleetRequest) => req.vehicleId.toString() === vehicleId && req.status === "pending"
    );
    
    if (existingRequest) {
      return jsonError("conflict", 400);
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
    return jsonError("internal_error", 500);
  }
}