"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function ReviewForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [bookingDetails, setBookingDetails] = useState<{
    tripId: string;
    pickup: string;
    dropoff?: string;
    date: string;
    time: string;
    vehicleDetails?: { name: string };
  } | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setError("Invalid booking link");
      setLoadingBooking(false);
      return;
    }

    // Fetch booking details
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        const data = await response.json();

        if (data.success) {
          setBookingDetails(data.booking);
        } else {
          setError(data.message || "Booking not found");
        }
      } catch {
        setError("Failed to load booking details");
      } finally {
        setLoadingBooking(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      setError("Please write a review");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || "Failed to submit review");
      }
    } catch {
      setError("Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your review has been submitted successfully. We appreciate your feedback!
            </p>
            <Button onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">How was your experience?</CardTitle>
          <CardDescription>
            We&apos;d love to hear about your trip with us
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookingDetails && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Trip Details</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Trip ID:</span> #{bookingDetails.tripId.slice(0, 8)}</p>
                <p><span className="font-medium">From:</span> {bookingDetails.pickup}</p>
                <p><span className="font-medium">To:</span> {bookingDetails.dropoff || 'Hourly booking'}</p>
                <p><span className="font-medium">Date:</span> {bookingDetails.date} at {bookingDetails.time}</p>
                <p><span className="font-medium">Vehicle:</span> {bookingDetails.vehicleDetails?.name}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate your experience
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tell us more about your experience
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about the service, driver, vehicle, or overall experience..."
                rows={6}
                className="w-full"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <ReviewForm />
    </Suspense>
  );
}
