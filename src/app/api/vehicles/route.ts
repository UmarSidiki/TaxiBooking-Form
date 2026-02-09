import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/database";
import { Vehicle, type IVehicle } from "@/models/vehicle";

// GET - Fetch all vehicles (Public endpoint - customers need to see available vehicles)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const filter = isActive !== null ? { isActive: isActive === "true" } : {};

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch vehicles",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new vehicle (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Role-based access control
    const userRole = session.user.role;
    if (userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body: IVehicle = await request.json();

    // Validate required fields.
    // Use explicit undefined/null checks for numeric fields so 0 is accepted.
    const missing: string[] = [];

    if (typeof body.name !== "string" || body.name.trim() === "") {
      missing.push("name");
    }

    if (typeof body.description !== "string" || body.description.trim() === "") {
      missing.push("description");
    }

    // Allow numeric 0 — only treat as missing when undefined or null
    if (body.persons === undefined || body.persons === null) {
      missing.push("persons");
    }

    if (body.price === undefined || body.price === null) {
      missing.push("price");
    }

    if (typeof body.category !== "string" || body.category.trim() === "") {
      missing.push("category");
    }

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.create(body);

    return NextResponse.json({
      success: true,
      message: "Vehicle created successfully",
      data: vehicle,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create vehicle",
      },
      { status: 500 }
    );
  }
}
