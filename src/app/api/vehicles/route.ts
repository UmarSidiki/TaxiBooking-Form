import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Vehicle, { IVehicle } from "@/models/Vehicle";

// GET - Fetch all vehicles
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

// POST - Create a new vehicle
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: IVehicle = await request.json();

    // Validate required fields
    if (!body.name || !body.description || !body.persons || !body.price || !body.category) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
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
