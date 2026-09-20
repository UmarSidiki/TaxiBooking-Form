"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { IBooking } from "@/models/booking";
import type { IDriver } from "@/models/driver";
import type { IPartner } from "@/models/partner";
import type { ISetting } from "@/models/settings";
import { apiGet, apiPatch } from "@/utils/api";
import { DateRange } from "react-day-picker";
import { useCurrency } from "@/contexts/CurrencyContext";
import { isBookingPassed as isBookingPassedAt } from "@/lib/rides/is-booking-passed";
import { filterAdminBookings } from "@/lib/rides/filter-admin-bookings";
import { DEFAULT_BOOKING_TIMEZONE } from "@/lib/rides/ride-constants";

const DEFAULT_REFUND_PERCENTAGE = 100;

export type AdminRideReview = {
  rating: number;
  comment: string;
  createdAt: Date;
};

export function useAdminRides() {
  const t = useTranslations();
  const { currencySymbol } = useCurrency();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [detailBooking, setDetailBooking] = useState<IBooking | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [partners, setPartners] = useState<IPartner[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [approvingPartnerId, setApprovingPartnerId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("date-asc");
  const [enableDrivers, setEnableDrivers] = useState(false);
  const [enablePartners, setEnablePartners] = useState(false);
  const [timezone, setTimezone] = useState<string>(DEFAULT_BOOKING_TIMEZONE);

  const [bookingReviews, setBookingReviews] = useState<
    Record<string, { rating: number; comment: string; createdAt: Date } | null>
  >({});

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<{ success: boolean; data: IBooking[] }>(
        "/api/bookings"
      );
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const data = await apiGet<{ success: boolean; data: IDriver[] }>(
        "/api/drivers"
      );
      if (data.success) {
        setDrivers(data.data);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      const data = await apiGet<{ partners: IPartner[] }>(
        "/api/admin/partners?status=approved"
      );
      if (data.partners) {
        setPartners(data.partners);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiGet<{ success: boolean; data: ISetting }>(
        "/api/settings"
      );
      if (data.success) {
        setEnableDrivers(data.data.enableDrivers ?? false);
        setEnablePartners(data.data.enablePartners ?? false);
        if (data.data.timezone) {
          setTimezone(data.data.timezone);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, []);

  // Custom helper to compare nominal time with "Now" in target timezone
  const isBookingPassed = useCallback(
    (dateStr: string, timeStr: string) =>
      isBookingPassedAt(dateStr, timeStr, timezone),
    [timezone]
  );

  const filterBookings = useCallback(() => {
    setFilteredBookings(
      filterAdminBookings({
        bookings,
        activeTab,
        searchQuery,
        paymentFilter,
        dateRange,
        sortBy,
        isBookingPassed,
      }),
    );
  }, [bookings, activeTab, searchQuery, paymentFilter, dateRange, sortBy, isBookingPassed]);

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
    fetchPartners();
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const handleCancelClick = (booking: IBooking) => {
    setSelectedBooking(booking);
    setRefundPercentage(DEFAULT_REFUND_PERCENTAGE);
    setShowCancelDialog(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking?._id) return;

    setCancelingId(selectedBooking._id.toString());
    try {
      const data = await apiPatch<{
        success: boolean;
        message: string;
        data: IBooking;
      }>(`/api/bookings/${selectedBooking._id}`, {
        action: "cancel",
        refundPercentage: refundPercentage,
      });

      if (data.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((b) =>
            b._id?.toString() === selectedBooking._id?.toString()
              ? data.data
              : b
          )
        );
        setShowCancelDialog(false);
        setSelectedBooking(null);
      } else {
        alert(`${t("Dashboard.Rides.CancelError")}: ${data.message}`);
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      alert(t("Dashboard.Rides.CancelBookingError"));
    } finally {
      setCancelingId(null);
    }
  };

  const handleAssignDriver = async (bookingId: string, driverId: string) => {
    setAssigningId(bookingId);
    try {
      const data = await apiPatch<{
        success: boolean;
        message: string;
        data: IBooking;
      }>(`/api/bookings/${bookingId}`, {
        action: "assign",
        driverId: driverId,
      });

      if (data.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((b) => (b._id?.toString() === bookingId ? data.data : b))
        );
        // Reset edit mode
        setSelectedBooking(null);
        alert(
          data.data.assignedDriver && bookingId !== data.data.assignedDriver._id
            ? t("Dashboard.Rides.driver-reassigned-successfully")
            : t("Dashboard.Rides.driver-assigned-successfully")
        );
      } else {
        alert(
          t("Dashboard.Rides.assignment-failed-data-message", {
            0: data.message,
          })
        );
      }
    } catch (error) {
      console.error("Error assigning driver:", error);
      alert(t("Dashboard.Rides.failed-to-assign-driver"));
    } finally {
      setAssigningId(null);
    }
  };

  const handleAssignPartner = async (bookingId: string, partnerId: string) => {
    setAssigningId(bookingId);
    try {
      const data = await apiPatch<{
        success: boolean;
        message: string;
        data: IBooking;
      }>(`/api/bookings/${bookingId}`, {
        action: "assignpartner",
        partnerId: partnerId,
      });

      if (data.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((b) => (b._id?.toString() === bookingId ? data.data : b))
        );
        // Reset edit mode
        setSelectedBooking(null);
        alert(
          data.data.assignedPartner &&
            bookingId !== data.data.assignedPartner._id
            ? t("Dashboard.Rides.partner-reassigned-successfully")
            : t("Dashboard.Rides.partner-assigned-successfully")
        );
      } else {
        alert(
          t("Dashboard.Rides.assignment-failed-data-message", {
            0: data.message,
          })
        );
      }
    } catch (error) {
      console.error("Error assigning partner:", error);
      alert(t("Dashboard.Rides.failed-to-assign-partner"));
    } finally {
      setAssigningId(null);
    }
  };

  const handleApprovePartnerReview = async (
    bookingId: string,
    marginPercentage: number
  ): Promise<boolean> => {
    setApprovingPartnerId(bookingId);
    try {
      const data = await apiPatch<{
        success: boolean;
        message: string;
        data: IBooking;
      }>(`/api/bookings/${bookingId}`, {
        action: "approvepartner",
        marginPercentage,
      });

      if (data.success) {
        // Update local state immediately
        setBookings((prev) =>
          prev.map((b) => (b._id?.toString() === bookingId ? data.data : b))
        );
        alert(t("Dashboard.Rides.partner-review-approved"));
        return true;
      } else {
        console.error("Partner approval failed:", data.message);
        alert(
          t("Dashboard.Rides.partner-review-error", {
            0: data.message,
          })
        );
        return false;
      }
    } catch (error) {
      console.error("Error approving partner review:", error);
      alert(t("Dashboard.Rides.partner-review-generic-error"));
      return false;
    } finally {
      setApprovingPartnerId(null);
    }
  };

  const canRefund = (booking: IBooking) => {
    return (
      booking.paymentStatus === "completed" &&
      booking.paymentMethod &&
      ["stripe", "bank_transfer"].includes(booking.paymentMethod) &&
      booking.status !== "canceled"
    );
  };

  return {
    t,
    currencySymbol,
    bookings,
    filteredBookings,
    isLoading,
    activeTab,
    setActiveTab,
    cancelingId,
    showCancelDialog,
    setShowCancelDialog,
    selectedBooking,
    refundPercentage,
    setRefundPercentage,
    detailBooking,
    setDetailBooking,
    searchQuery,
    setSearchQuery,
    paymentFilter,
    setPaymentFilter,
    dateRange,
    setDateRange,
    showFilters,
    setShowFilters,
    drivers,
    partners,
    assigningId,
    approvingPartnerId,
    sortBy,
    setSortBy,
    enableDrivers,
    enablePartners,
    timezone,
    bookingReviews,
    setBookingReviews,
    fetchBookings,
    isBookingPassed,
    handleCancelClick,
    handleCancelBooking,
    handleAssignDriver,
    handleAssignPartner,
    handleApprovePartnerReview,
    canRefund,
  };
}
