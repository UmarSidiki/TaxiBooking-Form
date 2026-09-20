import type { FormData } from "@/features/booking/context/booking-form-context";

export function createStep1EmbedUrl(formData: FormData): string {
  const locale = window.location.pathname.split("/")[1]; // Extract locale from URL path
  const params = new URLSearchParams({
    step: "2",
    bookingType: formData.bookingType,
    pickup: formData.pickup.trim(),
    date: formData.date,
    time: formData.time,
    passengers: String(formData.passengers),
    source: "embed_v1",
  });

  // Add dropoff and tripType only for destination bookings
  if (formData.bookingType === "destination") {
    params.set("dropoff", formData.dropoff.trim());
    params.set(
      "tripType",
      formData.tripType === "roundtrip" ? "return" : "oneway"
    );

    // Add return date/time for roundtrip
    if (formData.tripType === "roundtrip") {
      if (formData.returnDate) params.set("returnDate", formData.returnDate);
      if (formData.returnTime) params.set("returnTime", formData.returnTime);
    }

    // Add stops if they exist (including duration)
    if (formData.stops.length > 0) {
      const filteredStops = formData.stops
        .filter((stop) => stop.location.trim())
        .map((stop) => ({
          location: stop.location,
          order: stop.order,
          duration: stop.duration || 0,
        }));
      if (filteredStops.length > 0) {
        params.set("stops", JSON.stringify(filteredStops));
      }
    }
  }

  // Add duration only for hourly bookings
  if (formData.bookingType === "hourly") {
    params.set("duration", String(formData.duration));
  }

  // Return the URL with locale path and parameters
  return `/${locale}?${params.toString()}`;
}
