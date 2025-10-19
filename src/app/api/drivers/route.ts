import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Driver, { IDriver } from "@/models/Driver";
import bcrypt from "bcryptjs";

// GET - Fetch all drivers
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const filter = isActive !== null ? { isActive: isActive === "true" } : {};

    const drivers = await Driver.find(filter).sort({ createdAt: -1 }).select("-password");

    return NextResponse.json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch drivers",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new driver
export async function POST(request: NextRequest) {
  try {
    console.log("Driver creation API called");
    await connectDB();

    const body: IDriver = await request.json();
    console.log("Request body:", { ...body, password: "[REDACTED]" });

    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      console.log("Missing required fields:", { name: !!body.name, email: !!body.email, password: !!body.password });
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingDriver = await Driver.findOne({ email: body.email });
    console.log("Existing driver check:", existingDriver ? "Found existing driver" : "No existing driver");
    if (existingDriver) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12);
    console.log("Password hashed successfully");

    const driver = await Driver.create({
      ...body,
      password: hashedPassword,
    });
    console.log("Driver created in database:", driver._id);

    // Return driver without password
    const driverResponse = { ...driver.toObject() };
    delete driverResponse.password;

    console.log("Driver creation successful, returning response");
    return NextResponse.json({
      success: true,
      message: "Driver created successfully",
      data: driverResponse,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create driver",
      },
      { status: 500 }
    );
  }
}