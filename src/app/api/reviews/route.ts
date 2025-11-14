import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Review } from "@/models/review";
import { Booking } from "@/models/booking";

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { bookingId, rating, comment } = body;

    // Validate input
    if (!bookingId || !rating || !comment) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return NextResponse.json(
        { success: false, message: "Review already submitted for this booking" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await Review.create({
      bookingId,
      tripId: booking.tripId,
      rating,
      comment,
      customerName: `${booking.firstName} ${booking.lastName}`,
      customerEmail: booking.email,
    });

    // Mark booking as reviewed
    await Booking.findByIdAndUpdate(bookingId, {
      reviewSubmitted: true,
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, message: "Review submitted successfully", review },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get all reviews (for admin)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (bookingId) {
      // Get review for specific booking
      const review = await Review.findOne({ bookingId }).lean();
      return NextResponse.json({ success: true, review });
    }

    // Get all reviews
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
