import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Vehicle } from "@/features/fleet/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { vehiclePatchSchema } from "@/features/fleet/schema/vehicle-write.schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, vehiclePatchSchema);
    if (!parsed.ok) return parsed.response;

    await connectDB();
    const { id } = await params;
    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { ...parsed.data, updatedAt: new Date() },
      { returnDocument: "after", runValidators: true }
    );
    if (!vehicle) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    await connectDB();
    const { id } = await params;
    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) return jsonError("not_found", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return jsonError("internal_error", 500);
  }
}
