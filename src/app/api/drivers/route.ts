import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Driver, type IDriver } from "@/models/driver";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { isValidEmail } from "@/lib/validation";

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
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await connectDB();

    const body: IDriver = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address format" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingDriver = await Driver.findOne({ email: body.email });
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

    const driver = await Driver.create({
      ...body,
      password: hashedPassword,
    });

    // Return driver without password
    const driverResponse = { ...driver.toObject() };
    delete driverResponse.password;

    return NextResponse.json({
      success: true,
      message: "Driver created successfully",
      data: driverResponse,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create driver",
      },
      { status: 500 }
    );
  }
}