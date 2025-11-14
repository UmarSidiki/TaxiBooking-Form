import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Booking } from "@/models/booking";

interface Params {
  params: Promise<{
    bookingId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    await connectDB();

    const { bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId).lean();

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
