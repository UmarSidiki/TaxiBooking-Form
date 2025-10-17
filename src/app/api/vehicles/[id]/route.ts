import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Vehicle, { IVehicle } from "@/models/Vehicle";

// GET - Fetch a single vehicle by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          message: "Vehicle not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch vehicle",
      },
      { status: 500 }
    );
  }
}

// PUT - Update a vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body: Partial<IVehicle> = await request.json();

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          message: "Vehicle not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update vehicle",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update a vehicle (alias for PUT)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

// DELETE - Delete a vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const vehicle = await Vehicle.findByIdAndDelete(id);

    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          message: "Vehicle not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete vehicle",
      },
      { status: 500 }
    );
  }
}
