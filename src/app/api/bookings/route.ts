import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";

// GET all bookings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // upcoming, completed, canceled
    
    const db = await getMongoDb();
    const collection = db.collection<Booking>("bookings");
    
    // Build query
    const query: Partial<Booking> = {};
    if (status) {
      query.status = status as "upcoming" | "completed" | "canceled";
    }
    
    // Fetch bookings sorted by date (newest first)
    const bookings = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
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
