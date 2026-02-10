import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/database";
import { FormLayout } from "@/models/form-layout";
import { FormLayoutCreateSchema } from "@/lib/schemas/form-layout.schema";
import { ZodError } from "zod";

// GET - Fetch all form layouts (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const layouts = await FormLayout.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: layouts });
  } catch (error) {
    console.error("Error fetching form layouts:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch form layouts" },
      { status: 500 }
    );
  }
}

// POST - Create a new form layout (Admin only)
export async function POST(request: NextRequest) {
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

    await connectDB();
    const body = await request.json();

    // Validate request body with Zod
    const validatedData = FormLayoutCreateSchema.parse(body);

    // If this layout is set as default, unset other defaults
    if (validatedData.isDefault) {
      await FormLayout.updateMany({}, { isDefault: false });
    }

    const layout = await FormLayout.create(validatedData);

    return NextResponse.json(
      { success: true, data: layout, message: "Layout created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating form layout:", error);
    
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
      { success: false, message: "Failed to create form layout" },
      { status: 500 }
    );
  }
}
