import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/database";
import { FormLayout } from "@/models/form-layout";

// POST - Duplicate a layout
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    if (userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const original = await FormLayout.findById(id);
    if (!original) {
      return NextResponse.json(
        { success: false, message: "Layout not found" },
        { status: 404 }
      );
    }

    const duplicate = await FormLayout.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      fields: original.fields,
      isDefault: false,
      isActive: false,
    });

    return NextResponse.json(
      { success: true, data: duplicate, message: "Layout duplicated successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error duplicating form layout:", error);
    return NextResponse.json(
      { success: false, message: "Failed to duplicate form layout" },
      { status: 500 }
    );
  }
}
