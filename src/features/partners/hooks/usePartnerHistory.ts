"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiGet } from "@/shared/http/api";
import { isBookingPassed as isBookingPassedAt } from "@/features/rides/lib/is-booking-passed";
import type { ISetting } from "@/features/settings/model";
import type { PartnerRideBooking } from "@/features/partners/ui/partner-ride.types";
import { DEFAULT_BOOKING_TIMEZONE } from "@/features/rides/lib/ride-constants";
import { useCurrency } from "@/shared/context/currency-context";

export type PartnerHistoryReview = {
  rating: number;
  comment: string;
};

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
      const reviews = await Promise.all(
        completed.map(async (booking) => {
          const reviewResponse = await fetch(`/api/reviews?bookingId=${booking._id}`);
          const reviewData = await reviewResponse.json();
          return [booking._id, reviewData.success ? reviewData.review : null] as const;
        })
      );
      setBookingReviews(Object.fromEntries(reviews));
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
