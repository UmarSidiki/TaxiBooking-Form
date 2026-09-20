import type { IBooking } from "@/models/booking";
import type { DateRange } from "react-day-picker";

const START_OF_DAY_HOURS = 0;
const END_OF_DAY_HOURS = 23;
const END_OF_DAY_MINUTES = 59;
const END_OF_DAY_SECONDS = 59;
const END_OF_DAY_MS = 999;

function getBookingDateTime(booking: IBooking) {
  return new Date(`${booking.date}T${booking.time}:00`);
}

export function filterAdminBookings({
  bookings,
  activeTab,
  searchQuery,
  paymentFilter,
  dateRange,
  sortBy,
  isBookingPassed,
}: {
  bookings: IBooking[];
  activeTab: string;
  searchQuery: string;
  paymentFilter: string;
  dateRange: DateRange | undefined;
  sortBy: string;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
}): IBooking[] {
  let filtered: IBooking[] = [];

  switch (activeTab) {
    case "upcoming":
      filtered = bookings.filter((b) => {
        if (b.status === "canceled") return false;
        if (b.status === "completed") return false;
        return !isBookingPassed(b.date, b.time);
      });
      break;
    case "passed":
      filtered = bookings.filter((b) => {
        if (b.status === "canceled") return false;
        if (b.status === "completed") return true;
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

      const checkDate = new Date(bookingDate);
      checkDate.setHours(START_OF_DAY_HOURS, START_OF_DAY_HOURS, START_OF_DAY_HOURS, START_OF_DAY_HOURS);

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(START_OF_DAY_HOURS, START_OF_DAY_HOURS, START_OF_DAY_HOURS, START_OF_DAY_HOURS);
        if (checkDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(END_OF_DAY_HOURS, END_OF_DAY_MINUTES, END_OF_DAY_SECONDS, END_OF_DAY_MS);
        if (checkDate > to) return false;
      }
      return true;
    });
  }

  if (paymentFilter !== "all") {
    filtered = filtered.filter(
      (booking) => booking.paymentStatus === paymentFilter,
    );
  }

  if (sortBy === "date-asc") {
    filtered.sort(
      (a, b) => getBookingDateTime(a).getTime() - getBookingDateTime(b).getTime(),
    );
  } else if (sortBy === "date-desc") {
    filtered.sort(
      (a, b) => getBookingDateTime(b).getTime() - getBookingDateTime(a).getTime(),
    );
  } else if (sortBy === "price-asc") {
    filtered.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
  } else if (sortBy === "price-desc") {
    filtered.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
  }

  return filtered;
}
