import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { FormLayout } from "@/features/form-builder/model";
import { FormLayoutCreateSchema } from "@/features/form-builder/schema/form-layout.schema";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    await connectDB();
    const layouts = await FormLayout.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: layouts });
  } catch (error) {
    console.error("Error fetching form layouts:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, FormLayoutCreateSchema);
    if (!parsed.ok) return parsed.response;

    await connectDB();
    if (parsed.data.isDefault) {
      await FormLayout.updateMany({}, { isDefault: false });
    }
    const layout = await FormLayout.create(parsed.data);
    return NextResponse.json({ success: true, data: layout }, { status: 201 });
  } catch (error) {
    console.error("Error creating form layout:", error);
    return jsonError("internal_error", 500);
  }
}
