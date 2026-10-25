export function rideDurationMinutes(booking: {
  bookingType?: string | null;
  duration?: number | null;
  tripType?: string | null;
}) {
  if (booking.bookingType === "hourly" && typeof booking.duration === "number" && booking.duration > 0) {
    return Math.round(booking.duration * 60);
  }
  return booking.tripType === "roundtrip" ? 120 : 60;
}

export function rideInterval(booking: {
  date: string;
  time: string;
  bookingType?: string | null;
  duration?: number | null;
  tripType?: string | null;
}) {
  const start = new Date(`${booking.date}T${booking.time || "00:00"}:00Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + rideDurationMinutes(booking) * 60_000);
  return { start, end };
}

export function intervalsOverlap(
  left: { start: Date; end: Date },
  right: { start: Date; end: Date },
) {
  return left.start < right.end && right.start < left.end;
}
