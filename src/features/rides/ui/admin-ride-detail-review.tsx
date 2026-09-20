"use client";

import type { IBooking } from "@/features/booking/model";
import type { AdminRideReview } from "@/features/rides/hooks/useAdminRides";
import { LONG_DATE, REVIEW_STAR_MAX } from "@/features/rides/lib/ride-format";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";
import { Star } from "lucide-react";
import { useLocale, type useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideDetailReview({
  booking,
  t,
  bookingReviews,
}: {
  booking: IBooking;
  t: TFn;
  bookingReviews: Record<string, AdminRideReview | null>;
}) {
  const locale = useLocale();
  const review = booking._id ? bookingReviews[booking._id.toString()] : null;
  if (!review) return null;

  const submitted = new Date(review.createdAt).toLocaleDateString(locale, LONG_DATE);

  return (
    <DeskOverlaySection title={t("Dashboard.Rides.customer-review")}>
      <div className="flex items-center gap-2">
        {Array.from({ length: REVIEW_STAR_MAX }, (_, index) => index + 1).map((star) => (
          <Star
            key={star}
            className={`size-5 ${
              star <= review.rating
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="text-sm font-semibold">
          {review.rating}/{REVIEW_STAR_MAX}
        </span>
      </div>
      <p className="text-sm text-foreground">&ldquo;{review.comment}&rdquo;</p>
      <p className="text-sm text-muted-foreground">
        {t("Dashboard.Rides.submitted-on", { date: submitted })}
      </p>
    </DeskOverlaySection>
  );
}
