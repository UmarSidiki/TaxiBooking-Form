"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { IBooking } from "@/features/booking/model";
import type { ISetting } from "@/features/settings/model";
import { apiGet } from "@/shared/http/api";
import { DateRange } from "react-day-picker";
import { useCurrency } from "@/shared/context/currency-context";
import { isBookingPassed as isBookingPassedAt } from "@/features/rides/lib/is-booking-passed";
import { filterDriverBookings } from "@/features/rides/lib/filter-driver-bookings";
import { DEFAULT_BOOKING_TIMEZONE } from "@/features/rides/lib/ride-constants";

export function useDriverDashboard() {
  const t = useTranslations();
  const { currencySymbol } = useCurrency();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [detailBooking, setDetailBooking] = useState<IBooking | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [timezone, setTimezone] = useState<string>(DEFAULT_BOOKING_TIMEZONE);

  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchAssignedRides = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await apiGet<{ success: boolean; data: IBooking[] }>(
        "/api/drivers/rides"
      );
      if (data.success) {
        setBookings(data.data);
      } else {
        setLoadError(t("Drivers.load_error"));
      }
    } catch {
      setLoadError(t("Drivers.load_error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const fetchSettings = useCallback(async () => {
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
  }, []);

  const isBookingPassed = useCallback(
    (dateStr: string, timeStr: string) =>
      isBookingPassedAt(dateStr, timeStr, timezone),
    [timezone]
  );

  const filterBookings = useCallback(() => {
    setFilteredBookings(
      filterDriverBookings({
        bookings,
        activeTab,
        searchQuery,
        dateRange,
        isBookingPassed,
      }),
    );
  }, [activeTab, bookings, dateRange, searchQuery, isBookingPassed]);

  useEffect(() => {
    fetchAssignedRides();
    fetchSettings();
  }, [fetchAssignedRides, fetchSettings]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);


  return {
    t,
    currencySymbol,
    bookings,
    filteredBookings,
    isLoading,
    activeTab,
    setActiveTab,
    detailBooking,
    setDetailBooking,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    showFilters,
    setShowFilters,
    timezone,
    fetchAssignedRides,
    isBookingPassed,
    loadError,
  };
}
