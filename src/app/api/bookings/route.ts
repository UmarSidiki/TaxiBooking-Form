import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking, { IBooking } from "@/models/Booking";

// GET all bookings
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // upcoming, completed, canceled

    // Build query
    const query: Partial<Pick<IBooking, 'status'>> = {};
    if (status) {
      query.status = status as "upcoming" | "completed" | "canceled";
    }

    // Fetch bookings sorted by date (newest first)
    const bookings = await Booking
      .find(query)
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch bookings",
      },
      { status: 500 }
    );
  }
}
