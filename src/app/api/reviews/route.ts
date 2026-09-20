import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Review } from "@/features/reviews/model";
import { Booking } from "@/features/booking/model";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { reviewCreateSchema } from "@/features/reviews/schema/review-create.schema";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const parsed = await parseJsonBody(request, reviewCreateSchema);
    if (!parsed.ok) return parsed.response;
    const { bookingId, rating, comment } = parsed.data;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return jsonError("not_found", 404);
    }

    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return jsonError("conflict", 400);
    }

    const review = await Review.create({
      bookingId,
      tripId: booking.tripId,
      rating,
      comment,
      customerName: `${booking.firstName} ${booking.lastName}`,
      customerEmail: booking.email,
    });

    await Booking.findByIdAndUpdate(bookingId, {
      reviewSubmitted: true,
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, review },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return jsonError("internal_error", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (bookingId) {
      const review = await Review.findOne({ bookingId }).lean();
      return NextResponse.json({ success: true, review });
    }

    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return jsonError("internal_error", 500);
  }
}
