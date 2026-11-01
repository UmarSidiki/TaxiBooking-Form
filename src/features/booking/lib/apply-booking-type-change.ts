import type { FormData } from "@/features/booking/context/booking-form-context";

/** Hourly rides have one pickup and one start time: no drop-off, stops or return leg.
 *  Clearing them here keeps the form, the map and pricing in step with the mode. */
export function applyBookingTypeChange(prev: FormData, bookingType: FormData["bookingType"]): FormData {
  if (bookingType === "destination") return { ...prev, bookingType };
  return {
    ...prev,
    bookingType,
    dropoff: "",
    dropoffLatLng: null,
    stops: [],
    tripType: "oneway",
    returnDate: "",
    returnTime: "",
  };
}
