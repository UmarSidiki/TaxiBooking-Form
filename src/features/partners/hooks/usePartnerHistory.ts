"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/shared/http/api";
import { isBookingPassed as isBookingPassedAt } from "@/features/rides/lib/is-booking-passed";
import type { ISetting } from "@/features/settings/model";
import type { PartnerRideBooking } from "@/features/partners/ui/partner-ride.types";
import { DEFAULT_BOOKING_TIMEZONE } from "@/features/rides/lib/ride-constants";
import { REVIEW_ID_BATCH_LIMIT } from "@/features/reviews/lib/review-batch-limit";
import { useCurrency } from "@/shared/context/currency-context";

export type PartnerHistoryReview = {
  rating: number;
  comment: string;
};

type ReviewBatchRow = {
  bookingId: string;
  rating: number;
  comment: string;
};

async function loadHistoryReviews(bookingIds: string[]) {
  const reviews: Record<string, PartnerHistoryReview | null> = {};
  if (bookingIds.length === 0) return reviews;

  const chunks: string[][] = [];
  for (let index = 0; index < bookingIds.length; index += REVIEW_ID_BATCH_LIMIT) {
    chunks.push(bookingIds.slice(index, index + REVIEW_ID_BATCH_LIMIT));
  }

  const pages = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await fetch(`/api/reviews?bookingIds=${chunk.join(",")}`);
      const body = (await response.json()) as {
        success?: boolean;
        reviews?: ReviewBatchRow[];
      };
      return body.success ? body.reviews ?? [] : [];
    }),
  );

  const byId = new Map(
    pages.flat().map((review) => [String(review.bookingId), review]),
  );
  for (const id of bookingIds) {
    const review = byId.get(id);
    reviews[id] = review ? { rating: review.rating, comment: review.comment } : null;
  }
  return reviews;
}

export function usePartnerHistory() {
  const t = useTranslations("Dashboard.Partners.Rides");
  const { currencySymbol } = useCurrency();
  const [bookings, setBookings] = useState<PartnerRideBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookingReviews, setBookingReviews] = useState<
    Record<string, PartnerHistoryReview | null>
  >({});
  const [timezone, setTimezone] = useState(DEFAULT_BOOKING_TIMEZONE);

  const isBookingPassed = useCallback(
    (dateStr: string, timeStr: string) => isBookingPassedAt(dateStr, timeStr, timezone),
    [timezone]
  );

  const fetchHistory = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [settingsData, ridesRes] = await Promise.all([
        apiGet<{ success: boolean; data: ISetting }>("/api/settings"),
        fetch("/api/partners/rides"),
      ]);
      if (settingsData.success && settingsData.data.timezone) {
        setTimezone(settingsData.data.timezone);
      }
      const data = await ridesRes.json();
      if (!data.success) {
        setLoadError(t("load-error"));
        return;
      }
      const all = data.data as PartnerRideBooking[];
      setBookings(all);
      const tz = settingsData.success && settingsData.data.timezone
        ? settingsData.data.timezone
        : DEFAULT_BOOKING_TIMEZONE;
      const completed = all.filter(
        (b) => b.status === "canceled" || isBookingPassedAt(b.date, b.time, tz)
      );
      setBookingReviews(await loadHistoryReviews(completed.map((booking) => booking._id)));
    } catch {
      setLoadError(t("load-error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const historyBookings = bookings.filter(
    (b) => b.status === "canceled" || isBookingPassed(b.date, b.time)
  );

  return {
    t,
    currencySymbol,
    loading,
    loadError,
    fetchHistory,
    historyBookings,
    bookingReviews,
    isBookingPassed,
  };
}
