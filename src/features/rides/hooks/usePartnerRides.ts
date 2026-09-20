"use client";

import type { PartnerRideBooking } from "@/features/partners/ui/partner-ride.types";
import { DEFAULT_BOOKING_TIMEZONE } from "@/features/rides/lib/ride-constants";
import { isBookingPassed as isBookingPassedAt } from "@/features/rides/lib/is-booking-passed";
import type { ISetting } from "@/features/settings/model";
import { apiGet } from "@/shared/http/api";
import { useCurrency } from "@/shared/context/currency-context";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

export function usePartnerRides() {
  const t = useTranslations("Dashboard.Partners.Rides");
  const tRides = useTranslations("Dashboard.Rides");
  const { currencySymbol } = useCurrency();
  const [bookings, setBookings] = useState<PartnerRideBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailBooking, setDetailBooking] = useState<PartnerRideBooking | null>(null);
  const [timezone, setTimezone] = useState<string>(DEFAULT_BOOKING_TIMEZONE);

  const fetchSettings = async () => {
    try {
      const data = await apiGet<{ success: boolean; data: ISetting }>(
        "/api/settings"
      );
      if (data.success && data.data.timezone) {
        setTimezone(data.data.timezone);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchRides = async () => {
    try {
      const response = await fetch("/api/partners/rides");
      const data = await response.json();

      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
    fetchSettings();
  }, []);

  const isBookingPassed = useCallback(
    (dateStr: string, timeStr: string) =>
      isBookingPassedAt(dateStr, timeStr, timezone),
    [timezone]
  );

  const upcomingBookings = bookings.filter(
    (b) => b.status !== "canceled" && !isBookingPassed(b.date, b.time)
  );

  return {
    t,
    tRides,
    currencySymbol,
    loading,
    detailBooking,
    setDetailBooking,
    isBookingPassed,
    upcomingBookings,
  };
}
