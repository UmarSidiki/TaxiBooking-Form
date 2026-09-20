import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { FormLayout } from "@/features/form-builder/model";
import { FormLayoutUpdateSchema } from "@/features/form-builder/schema/form-layout.schema";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const layout = await FormLayout.findById(id);
    if (!layout) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, data: layout });
  } catch (error) {
    console.error("Error fetching form layout:", error);
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

    const parsed = await parseJsonBody(request, FormLayoutUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const { id } = await params;
    await connectDB();
    if (parsed.data.isDefault) {
      await FormLayout.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }
    const layout = await FormLayout.findByIdAndUpdate(id, parsed.data, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!layout) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, data: layout });
  } catch (error) {
    console.error("Error updating form layout:", error);
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

    const { id } = await params;
    await connectDB();
    const layout = await FormLayout.findByIdAndDelete(id);
    if (!layout) return jsonError("not_found", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting form layout:", error);
    return jsonError("internal_error", 500);
  }
}
