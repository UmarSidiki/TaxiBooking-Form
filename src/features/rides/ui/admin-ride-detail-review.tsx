"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { AdminRideReview } from "@/features/rides/hooks/useAdminRides";
import { LONG_EN_US_DATE, REVIEW_STAR_MAX } from "@/features/rides/lib/ride-format";
import type { IBooking } from "@/features/booking/model";
import { Star } from "lucide-react";

export function AdminRideDetailReview({
  booking,
  bookingReviews,
}: {
  booking: IBooking;
  bookingReviews: Record<string, AdminRideReview | null>;
}) {
  const review =
    booking._id ? bookingReviews[booking._id.toString()] : null;
  if (!review) {
    return null;
  }

  return (
                  <Card className="border border-border shadow-sm bg-background">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        Customer Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {/* Star Rating */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {Array.from(
                              { length: REVIEW_STAR_MAX },
                              (_, index) => index + 1
                            ).map((star) => (
                              <Star
                                key={star}
                                className={`w-6 h-6 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            {review.rating}/{REVIEW_STAR_MAX}
                          </span>
                        </div>

                        {/* Review Comment */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-gray-700 italic">
                            &ldquo;
                            {review.comment}
                            &rdquo;
                          </p>
                        </div>

                        {/* Review Date */}
                        <div className="text-sm text-gray-500">
                          Submitted on{" "}
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            LONG_EN_US_DATE
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
  );
}
