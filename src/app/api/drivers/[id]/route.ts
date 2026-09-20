import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/shared/db";
import { Driver } from "@/features/drivers/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { driverPatchSchema } from "@/features/drivers/schema/driver-write.schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    await connectDB();
    const { id } = await params;
    const driver = await Driver.findById(id).select("-password");
    if (!driver) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, driverPatchSchema);
    if (!parsed.ok) return parsed.response;
    const { id } = await params;
    await connectDB();

    if (parsed.data.email) {
      const existingDriver = await Driver.findOne({
        email: parsed.data.email,
        _id: { $ne: id },
      });
      if (existingDriver) return jsonError("conflict", 400);
    }

    const update = { ...parsed.data };
    if (update.password) {
      update.password = await bcrypt.hash(update.password, 12);
    } else {
      delete update.password;
    }

    const driver = await Driver.findByIdAndUpdate(id, update, {
      returnDocument: "after",
    });
    if (!driver) return jsonError("not_found", 404);

    const driverResponse = { ...driver.toObject() };
    delete driverResponse.password;
    return NextResponse.json({ success: true, data: driverResponse });
  } catch (error) {
    console.error("Error updating driver:", error);
    return jsonError("internal_error", 500);
  }
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
    const driver = await Driver.findByIdAndDelete(id);
    if (!driver) return jsonError("not_found", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return jsonError("internal_error", 500);
  }
}
