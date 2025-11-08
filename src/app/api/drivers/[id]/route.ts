import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import {Driver} from "@/models/driver";
import bcrypt from "bcryptjs";

// GET - Fetch a single driver
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const driver = await Driver.findById(id).select("-password");

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          message: "Driver not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch driver",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update a driver
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();

    // Check if email already exists for another driver
    if (body.email) {
      const existingDriver = await Driver.findOne({
        email: body.email,
        _id: { $ne: id }
      });
      if (existingDriver) {
        return NextResponse.json(
          {
            success: false,
            message: "Email already exists",
          },
          { status: 400 }
        );
      }
    }

    // Handle password update
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 12);
    } else {
      // Remove password from update if empty
      delete body.password;
    }

    const driver = await Driver.findByIdAndUpdate(id, body, { new: true });

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          message: "Driver not found",
        },
        { status: 404 }
      );
    }

    // Return driver without password
    const driverResponse = { ...driver.toObject() };
    delete driverResponse.password;

    return NextResponse.json({
      success: true,
      message: "Driver updated successfully",
      data: driverResponse,
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update driver",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a driver
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const driver = await Driver.findByIdAndDelete(id);

    if (!driver) {
      return NextResponse.json(
        {
          success: false,
          message: "Driver not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete driver",
      },
      { status: 500 }
    );
  }
}