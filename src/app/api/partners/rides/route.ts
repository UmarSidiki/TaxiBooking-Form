import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Booking } from "@/models/booking";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "partner") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Find all bookings assigned to this partner
    const bookings = await Booking.find({
      "assignedDriver._id": session.user.id,
      status: { $in: ["upcoming", "completed"] },
    })
      .sort({ date: 1, time: 1 })
      .select("-__v");

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching partner rides:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch rides",
      },
      { status: 500 }
    );
  }
}
