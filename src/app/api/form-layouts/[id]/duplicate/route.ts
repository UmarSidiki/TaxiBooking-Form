import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { FormLayout } from "@/features/form-builder/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    await connectDB();

    const original = await FormLayout.findById(id);
    if (!original) return jsonError("not_found", 404);

    const duplicate = await FormLayout.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      fields: original.fields,
      isDefault: false,
      isActive: false,
    });

    return NextResponse.json(
      { success: true, data: duplicate },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error duplicating form layout:", error);
    return jsonError("internal_error", 500);
  }
}
