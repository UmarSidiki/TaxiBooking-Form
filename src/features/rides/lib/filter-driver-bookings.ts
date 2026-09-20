import type { IBooking } from "@/models/booking";
import type { DateRange } from "react-day-picker";

export function filterDriverBookings({
  bookings,
  activeTab,
  searchQuery,
  dateRange,
  isBookingPassed,
}: {
  bookings: IBooking[];
  activeTab: string;
  searchQuery: string;
  dateRange: DateRange | undefined;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
}): IBooking[] {
  let filtered: IBooking[] = [];

  switch (activeTab) {
    case "upcoming":
      filtered = bookings.filter((b) => {
        if (b.status === "canceled") return false;
        return !isBookingPassed(b.date, b.time);
      });
      break;
    case "passed":
      filtered = bookings.filter((b) => {
        if (b.status === "canceled") return false;
        return isBookingPassed(b.date, b.time);
      });
      break;
    case "canceled":
      filtered = bookings.filter((b) => b.status === "canceled");
      break;
    default:
      filtered = [...bookings];
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (booking) =>
        booking.tripId.toLowerCase().includes(query) ||
        booking.firstName.toLowerCase().includes(query) ||
        booking.lastName.toLowerCase().includes(query) ||
        booking.email.toLowerCase().includes(query) ||
        booking.phone.includes(query) ||
        booking.pickup.toLowerCase().includes(query) ||
        (booking.dropoff && booking.dropoff.toLowerCase().includes(query)) ||
        (booking.vehicleDetails?.name &&
          booking.vehicleDetails.name.toLowerCase().includes(query)),
    );
  }

  if (dateRange?.from || dateRange?.to) {
    filtered = filtered.filter((booking) => {
      const bookingDate = new Date(booking.date);
      const fromDate = dateRange.from;
      const toDate = dateRange.to;

      if (fromDate && bookingDate < fromDate) return false;
      if (toDate && bookingDate > toDate) return false;
      return true;
    });
  }

  return filtered;
}
