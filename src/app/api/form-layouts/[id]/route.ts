import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/database";
import { FormLayout } from "@/models/form-layout";
import { FormLayoutUpdateSchema } from "@/lib/schemas/form-layout.schema";
import { ZodError } from "zod";

// GET - Fetch single layout
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();
    const layout = await FormLayout.findById(id);

    if (!layout) {
      return NextResponse.json(
        { success: false, message: "Layout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: layout });
  } catch (error) {
    console.error("Error fetching form layout:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch form layout" },
      { status: 500 }
    );
  }
}

// PATCH - Update a form layout
export async function PATCH(
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
    const body = await request.json();

    // Validate request body with Zod
    const validatedData = FormLayoutUpdateSchema.parse(body);

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await FormLayout.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }

    const layout = await FormLayout.findByIdAndUpdate(id, validatedData, {
      new: true,
      runValidators: true
    });

    if (!layout) {
      return NextResponse.json(
        { success: false, message: "Layout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: layout,
      message: "Layout updated successfully",
    });
  } catch (error) {
    console.error("Error updating form layout:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: "Failed to update form layout" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a form layout
export async function DELETE(
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

    const layout = await FormLayout.findByIdAndDelete(id);

    if (!layout) {
      return NextResponse.json(
        { success: false, message: "Layout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Layout deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting form layout:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete form layout" },
      { status: 500 }
    );
  }
}
